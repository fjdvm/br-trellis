using System.Text.Json;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;

namespace api_crms.Services;

public sealed class EmailIngestionService(IEmailRepository emailRepository) : IEmailIngestionService
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

        await ProcessInboundEmailAsync(webhookPayload.Data, cancellationToken);

        await emailRepository.MarkEventProcessedAsync(eventId, eventType, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private async Task ProcessInboundEmailAsync(
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
            await AppendMessageAsync(ticket.Id, ticket.ContactId, data, occurredAt, cancellationToken);
        }
        else
        {
            // Existing thread → append a message; the customer is now waiting on us.
            existing.WaitingOn = WaitingOn.Agent;
            existing.UpdatedAt = occurredAt;
            await AppendMessageAsync(
                existing.Id, existing.ContactId ?? contactId, data, occurredAt, cancellationToken);
        }
    }

    private async Task AppendMessageAsync(
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
    }

    private static DateTimeOffset ParseTimestamp(string? timestamp)
    {
        return DateTimeOffset.TryParse(timestamp, out var result)
            ? result
            : DateTimeOffset.UtcNow;
    }
}
