using System.Text.Json;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;

namespace api_crms.Services;

/// <summary>
/// Ingests shop-chat Ticket/Message events (#122). Mirrors
/// <see cref="EmailIngestionService"/>'s delivery semantics — dedup-by-event-id,
/// transactional, thread-keyed — but resolves the Contact via
/// <see cref="IContactIdentityService"/> (email in, Contact out) and tags new
/// tickets with <see cref="TicketSource.Ecommerce"/>.
/// </summary>
public sealed class TicketIngestionService(
    ITicketIngestionRepository ticketRepository,
    IContactIdentityService contactIdentityService) : ITicketIngestionService
{
    private const string EcommerceSourceSystem = "ecommerce";
    private const string MessageReceivedEventType = "ticket.message.received";

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

        if (eventType != MessageReceivedEventType)
        {
            throw new InvalidOperationException($"Unknown event type: {eventType}");
        }

        await ProcessMessageAsync(webhookPayload.Data, cancellationToken);

        await ticketRepository.MarkEventProcessedAsync(eventId, eventType, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private async Task ProcessMessageAsync(
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
            var ticket = new Ticket
            {
                Id = Guid.NewGuid(),
                ContactId = contactId,
                ExternalThreadId = conversationId,
                Subject = (data.Subject ?? string.Empty).Trim(),
                Status = TicketStatus.Unclaimed,
                WaitingOn = WaitingOn.Agent,
                Source = TicketSource.Ecommerce,
                CreatedAt = occurredAt,
                UpdatedAt = occurredAt,
            };
            await ticketRepository.AddTicketAsync(ticket, cancellationToken);
            await AppendMessageAsync(ticket.Id, contactId, data.MessageBody, occurredAt, cancellationToken);
        }
        else
        {
            // Customer sent another chat message — they are now waiting on us. Source
            // is set once at creation and never rewritten.
            existing.WaitingOn = WaitingOn.Agent;
            existing.UpdatedAt = occurredAt;
            await AppendMessageAsync(
                existing.Id, existing.ContactId ?? contactId, data.MessageBody, occurredAt, cancellationToken);
        }
    }

    private async Task<Guid> ResolveContactIdAsync(
        TicketEventData data, CancellationToken cancellationToken)
    {
        var email = data.CustomerEmail.Trim();
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

    private async Task AppendMessageAsync(
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
    }

    private static DateTimeOffset ParseTimestamp(string? timestamp)
    {
        return DateTimeOffset.TryParse(timestamp, out var result)
            ? result
            : DateTimeOffset.UtcNow;
    }
}
