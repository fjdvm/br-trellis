using System.Text.Json;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class EmailIngestionService(
    IEmailRepository emailRepository,
    IConversationBroadcaster broadcaster) : IEmailIngestionService
{
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
        if (await emailRepository.HasProcessedEventAsync(eventId, cancellationToken))
        {
            return false; // Already processed (dedup) — redelivery is a no-op.
        }

        await using var transaction = await emailRepository.BeginTransactionAsync(cancellationToken);

        var webhookPayload = JsonSerializer.Deserialize<EmailWebhookPayload>(payload, JsonOptions)
            ?? throw new InvalidOperationException("Invalid webhook payload.");

        if (eventType != "email.received")
        {
            throw new InvalidOperationException($"Unknown event type: {eventType}");
        }

        var outcome = await ProcessInboundEmailAsync(webhookPayload.Data, cancellationToken);

        await emailRepository.MarkEventProcessedAsync(eventId, eventType, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        // Broadcast only after the commit succeeds — a rolled-back ingestion
        // (an exception above) never reaches here, so a failed write never pushes.
        await BroadcastAsync(outcome, cancellationToken);
        return true;
    }

    /// <summary>
    /// Captures what an inbound-email ingestion touched so the caller can
    /// broadcast the right real-time events after the transaction commits: the
    /// appended message (to the ticket's thread) and either a new-ticket or a
    /// status-change event (to the staff Inbox).
    /// </summary>
    private sealed record IngestionOutcome(
        Ticket Ticket, Message Message, bool IsNewTicket);

    private async Task<IngestionOutcome> ProcessInboundEmailAsync(
        EmailEventData data, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(data.ThreadId))
        {
            throw new InvalidOperationException("ThreadId is required.");
        }

        if (string.IsNullOrWhiteSpace(data.Body))
        {
            throw new InvalidOperationException("Body is required.");
        }

        var occurredAt = ParseTimestamp(data.OccurredAt);

        Guid? contactId = null;
        if (data.ContactId.HasValue
            && await emailRepository.ContactExistsAsync(data.ContactId.Value, cancellationToken))
        {
            contactId = data.ContactId.Value;
        }

        var existing = await emailRepository.GetTicketByThreadIdAsync(
            data.ThreadId.Trim(), cancellationToken);

        if (existing is null)
        {
            // New inbound email → new ticket entering the triage queue.
            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                ContactId = contactId,
                ExternalThreadId = data.ThreadId.Trim(),
                Subject = (data.Subject ?? string.Empty).Trim(),
                Status = TicketStatus.Unclaimed,
                WaitingOn = WaitingOn.Agent,
                Source = TicketSource.Email,
                CreatedAt = occurredAt,
                UpdatedAt = occurredAt,
            };
            await emailRepository.AddTicketAsync(ticket, cancellationToken);
            var message = await AppendMessageAsync(
                ticket.Id, ticket.ContactId, data, occurredAt, cancellationToken);
            return new IngestionOutcome(ticket, message, IsNewTicket: true);
        }
        else
        {
            // Existing thread → append a message; the customer is now waiting on us.
            existing.WaitingOn = WaitingOn.Agent;
            existing.UpdatedAt = occurredAt;
            var message = await AppendMessageAsync(
                existing.Id, existing.ContactId ?? contactId, data, occurredAt, cancellationToken);
            return new IngestionOutcome(existing, message, IsNewTicket: false);
        }
    }

    /// <summary>
    /// Pushes the real-time events for a committed inbound-email ingestion: the
    /// new message to the ticket's thread group (so an open thread updates live —
    /// #139), and a ticket-list event to the staff Inbox — a new-ticket event
    /// when the email opened a ticket, or a status-change event when it flipped an
    /// existing ticket's WaitingOn to Agent (#141).
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

    private async Task<Message> AppendMessageAsync(
        Guid ticketId,
        Guid? senderContactId,
        EmailEventData data,
        DateTimeOffset sentAt,
        CancellationToken cancellationToken)
    {
        var message = new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            SenderType = MessageSenderType.Contact,
            SenderContactId = senderContactId,
            Content = data.Body.Trim(),
            SentAt = sentAt,
        };
        await emailRepository.AddMessageAsync(message, cancellationToken);
        return message;
    }

    private static DateTimeOffset ParseTimestamp(string? timestamp)
    {
        return DateTimeOffset.TryParse(timestamp, out var result)
            ? result
            : DateTimeOffset.UtcNow;
    }
}
