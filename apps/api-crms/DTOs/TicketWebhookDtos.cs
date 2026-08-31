namespace api_crms.DTOs;

/// <summary>
/// Envelope for a shop-chat Ticket/Message event delivered to the Tickets webhook.
/// Mirrors the Email/Ecommerce envelope (EventId / EventType / Data) so the
/// at-least-once, dedup-by-event-id delivery contract (ADR 0001) is identical.
/// </summary>
public sealed record TicketWebhookPayload(
    string EventId,
    string EventType,
    TicketEventData Data);

/// <summary>
/// A single shop-chat message. <see cref="ConversationId"/> groups messages of one
/// chat session into a single Ticket (analogous to an email ThreadId).
/// <see cref="CustomerEmail"/> feeds Identity Resolution — the Contact is resolved
/// (or created) from it, never supplied pre-resolved.
/// </summary>
public sealed record TicketEventData(
    string ConversationId,
    string CustomerEmail,
    string? CustomerName,
    string MessageBody,
    string? Subject,
    string? OccurredAt);
