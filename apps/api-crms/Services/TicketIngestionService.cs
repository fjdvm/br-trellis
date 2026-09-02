using System.Text.Json;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

/// <summary>
/// Ingests shop-chat Ticket/Message events (#122). Mirrors
/// <see cref="EmailIngestionService"/>'s delivery semantics — dedup-by-event-id,
/// transactional, thread-keyed — but resolves the Contact via
/// <see cref="IContactIdentityService"/> (email in, Contact out) and tags new
/// tickets with <see cref="TicketSource.Ecommerce"/>. After a successful commit it
/// broadcasts the same real-time events every write path uses (#140/#141).
/// </summary>
public sealed class TicketIngestionService(
    ITicketIngestionRepository ticketRepository,
    IContactIdentityService contactIdentityService,
    IConversationBroadcaster broadcaster) : ITicketIngestionService
{
    private const string EcommerceSourceSystem = "ecommerce";
    private const string MessageReceivedEventType = "ticket.message.received";
    private const string CanceledEventType = "ticket.canceled";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<bool> ProcessEventAsync(
        string eventId,
        string eventType,
        string payload,
        CancellationToken cancellationToken = default)
    {
        if (await ticketRepository.HasProcessedEventAsync(eventId, cancellationToken))
        {
            return false; // Already processed (dedup) — redelivery is a no-op.
        }

        await using var transaction = await ticketRepository.BeginTransactionAsync(cancellationToken);

        var webhookPayload = JsonSerializer.Deserialize<TicketWebhookPayload>(payload, JsonOptions)
            ?? throw new InvalidOperationException("Invalid webhook payload.");

        switch (eventType)
        {
            case MessageReceivedEventType:
            {
                var outcome = await ProcessMessageAsync(webhookPayload.Data, cancellationToken);

                await ticketRepository.MarkEventProcessedAsync(eventId, eventType, cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                // Broadcast only after the commit succeeds — a rolled-back ingestion
                // never reaches here, so a failed write never pushes.
                await BroadcastAsync(outcome, cancellationToken);
                return true;
            }

            case CanceledEventType:
            {
                var canceled = await ProcessCancellationAsync(webhookPayload.Data, cancellationToken);

                // Record the event id regardless of outcome so at-least-once redelivery
                // is a dedup no-op — an unknown conversation or an already-terminal
                // ticket is acknowledged, not retried forever.
                await ticketRepository.MarkEventProcessedAsync(eventId, eventType, cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                // A status change fires only when the cancel actually flipped a ticket.
                if (canceled is not null)
                {
                    await broadcaster.BroadcastTicketStatusChangedAsync(
                        TicketMapper.ToSummary(canceled), cancellationToken);
                }
                return true;
            }

            default:
                throw new InvalidOperationException($"Unknown event type: {eventType}");
        }
    }

    /// <summary>
    /// Flips an existing (non-terminal) ticket to <see cref="TicketStatus.Canceled"/>
    /// in response to a customer-originated <c>ticket.canceled</c> event, resolving it
    /// by its conversation key. Returns the mutated ticket when a change was made, or
    /// <c>null</c> when there was nothing to cancel (unknown conversation, or the ticket
    /// is already terminal) — the caller acknowledges the event either way so redelivery
    /// can't wedge.
    /// </summary>
    private async Task<Ticket?> ProcessCancellationAsync(
        TicketEventData data, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(data.ConversationId))
        {
            throw new InvalidOperationException("ConversationId is required.");
        }

        var ticket = await ticketRepository.GetTicketByThreadIdAsync(
            data.ConversationId.Trim(), cancellationToken);

        // Unknown conversation → safe no-op (acknowledged, not an error).
        if (ticket is null)
        {
            return null;
        }

        // Completed and Canceled are terminal — never reopen or overwrite them.
        if (ticket.Status is TicketStatus.Completed or TicketStatus.Canceled)
        {
            return null;
        }

        ticket.Status = TicketStatus.Canceled;
        ticket.UpdatedAt = ParseTimestamp(data.OccurredAt);
        await ticketRepository.SaveChangesAsync(cancellationToken);
        return ticket;
    }

    /// <summary>
    /// Captures what a shop-chat ingestion touched so the caller can broadcast the
    /// right real-time events after commit: the appended message (to the ticket's
    /// thread) and either a new-ticket or a status-change event (to the Inbox).
    /// </summary>
    private sealed record IngestionOutcome(
        Ticket Ticket, Message Message, bool IsNewTicket);

    private async Task<IngestionOutcome> ProcessMessageAsync(
        TicketEventData data, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(data.ConversationId))
        {
            throw new InvalidOperationException("ConversationId is required.");
        }

        if (string.IsNullOrWhiteSpace(data.MessageBody))
        {
            throw new InvalidOperationException("MessageBody is required.");
        }

        if (string.IsNullOrWhiteSpace(data.CustomerEmail))
        {
            throw new InvalidOperationException("CustomerEmail is required.");
        }

        var occurredAt = ParseTimestamp(data.OccurredAt);
        var conversationId = data.ConversationId.Trim();

        var contactId = await ResolveContactIdAsync(data, cancellationToken);

        var existing = await ticketRepository.GetTicketByThreadIdAsync(conversationId, cancellationToken);
        if (existing is null)
        {
            // #148 amendment / ADR 0006 (Option 1): adopt a well-formed caller-supplied
            // Guid as the Ticket's own id (api-oos mints the conversation key as the
            // ticket id). A non-Guid opening key falls back to a generated id. Either
            // way ExternalThreadId == Ticket.Id. Non-collision is guaranteed by the
            // find-or-create above — a supplied id that already exists is appended to,
            // not re-created — so this branch only runs for a genuinely new id.
            var ticketId = Guid.TryParse(conversationId, out var suppliedId)
                ? suppliedId
                : Guid.NewGuid();
            var ticket = new Ticket
            {
                Id = ticketId,
                ContactId = contactId,
                ExternalThreadId = ticketId.ToString(),
                Subject = (data.Subject ?? string.Empty).Trim(),
                Status = TicketStatus.Unclaimed,
                WaitingOn = WaitingOn.Agent,
                Source = TicketSource.Ecommerce,
                CreatedAt = occurredAt,
                UpdatedAt = occurredAt,
            };
            await ticketRepository.AddTicketAsync(ticket, cancellationToken);
            var message = await AppendMessageAsync(
                ticket.Id, contactId, data.MessageBody, occurredAt, cancellationToken);
            return new IngestionOutcome(ticket, message, IsNewTicket: true);
        }
        else
        {
            // Customer sent another chat message — they are now waiting on us. Source
            // is set once at creation and never rewritten.
            existing.WaitingOn = WaitingOn.Agent;
            existing.UpdatedAt = occurredAt;
            var message = await AppendMessageAsync(
                existing.Id, existing.ContactId ?? contactId, data.MessageBody, occurredAt, cancellationToken);
            return new IngestionOutcome(existing, message, IsNewTicket: false);
        }
    }

    /// <summary>
    /// Pushes the real-time events for a committed shop-chat ingestion: the new
    /// message to the ticket's thread group (#140), and a ticket-list event to the
    /// staff Inbox — a new-ticket event when the chat opened a ticket, or a
    /// status-change event when it flipped an existing ticket's WaitingOn (#141).
    /// </summary>
    private async Task BroadcastAsync(IngestionOutcome outcome, CancellationToken cancellationToken)
    {
        await broadcaster.BroadcastMessageAsync(
            outcome.Ticket.Id, MessageMapper.ToDto(outcome.Message), cancellationToken);

        var summary = TicketMapper.ToSummary(outcome.Ticket);
        if (outcome.IsNewTicket)
        {
            await broadcaster.BroadcastNewTicketAsync(summary, cancellationToken);
        }
        else
        {
            await broadcaster.BroadcastTicketStatusChangedAsync(summary, cancellationToken);
        }
    }

    private async Task<Guid> ResolveContactIdAsync(
        TicketEventData data, CancellationToken cancellationToken)
    {
        // CustomerEmail is validated non-empty by ProcessMessageAsync before this runs;
        // the cancel path never resolves a contact.
        var email = data.CustomerEmail!.Trim();
        var result = await contactIdentityService.ResolveOrCreateContactAsync(
            new ResolveOrCreateContactCommand(
                SourceSystem: EcommerceSourceSystem,
                SourceId: $"customer:{email.ToLowerInvariant()}",
                Name: data.CustomerName,
                Email: email,
                Phone: null),
            cancellationToken);
        return result.ContactId;
    }

    private async Task<Message> AppendMessageAsync(
        Guid ticketId,
        Guid? senderContactId,
        string body,
        DateTimeOffset sentAt,
        CancellationToken cancellationToken)
    {
        var message = new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            SenderType = MessageSenderType.Contact,
            SenderContactId = senderContactId,
            Content = body.Trim(),
            SentAt = sentAt,
        };
        await ticketRepository.AddMessageAsync(message, cancellationToken);
        return message;
    }

    private static DateTimeOffset ParseTimestamp(string? timestamp)
    {
        return DateTimeOffset.TryParse(timestamp, out var result)
            ? result
            : DateTimeOffset.UtcNow;
    }
}
