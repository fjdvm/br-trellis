namespace ApiOos.DTOs.Chat;

/// <summary>
/// A chat message as it flows through the api-oos chat hub. The browser only ever
/// talks to this hub — never directly to api-crms.
/// </summary>
public sealed class ChatMessageDto
{
    public required string Id { get; init; }
    public required string ConversationId { get; init; }
    public required string SenderId { get; init; }
    public string? SenderName { get; init; }

    /// <summary>"customer", "agent", or "bot".</summary>
    public required string SenderType { get; init; }

    public required string Content { get; init; }
    public required string SentAt { get; init; }
}

/// <summary>
/// Input a customer's browser sends to the hub to post a chat message. Carries the
/// Identity Handshake email so api-crms can resolve the Contact — a message without
/// an identifying email is rejected (no fully-anonymous messaging).
/// </summary>
public sealed class SendChatMessageInput
{
    public required string ConversationId { get; init; }
    public required string CustomerEmail { get; init; }
    public string? CustomerName { get; init; }
    public required string Content { get; init; }
}
