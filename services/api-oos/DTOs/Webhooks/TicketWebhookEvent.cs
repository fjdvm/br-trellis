namespace ApiOos.DTOs.Webhooks;

/// <summary>
/// Envelope for a shop-chat Ticket/Message event sent to api-crms's Tickets webhook
/// (<c>POST api/v1/webhooks/tickets</c>). Shape matches api-crms's
/// <c>TicketWebhookPayload</c> (EventId / EventType / Data).
/// </summary>
public sealed class TicketWebhookEvent
{
    public required string EventId { get; init; }
    public required string EventType { get; init; }
    public required TicketWebhookData Data { get; init; }
}

/// <summary>
/// Event data for a single shop-chat message. Matches api-crms's <c>TicketEventData</c>.
/// <c>ConversationId</c> groups a chat session into one Ticket; <c>CustomerEmail</c>
/// is the Identity Handshake email api-crms resolves the Contact from.
/// </summary>
public sealed class TicketWebhookData
{
    public required string ConversationId { get; init; }
    public required string CustomerEmail { get; init; }
    public string? CustomerName { get; init; }
    public required string MessageBody { get; init; }
    public string? Subject { get; init; }
    public string? OccurredAt { get; init; }
}
