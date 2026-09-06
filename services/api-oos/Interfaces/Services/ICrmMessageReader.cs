namespace ApiOos.Interfaces.Services;

/// <summary>
/// A message read back from api-crms for a conversation. Only the fields the relay
/// needs are modelled.
/// </summary>
public sealed class CrmMessage
{
    public required string Id { get; init; }

    /// <summary>"Contact" or "Staff" (as api-crms serialises MessageSenderType).</summary>
    public required string SenderType { get; init; }

    public string? SenderStaffName { get; init; }
    public required string Content { get; init; }
    public required DateTimeOffset SentAt { get; init; }
}

/// <summary>
/// Reads new messages for a conversation from api-crms's conversation-messages
/// endpoint. The only outbound direction is api-oos → api-crms (a poll); api-crms
/// never calls back (ADR 0002).
/// </summary>
public interface ICrmMessageReader
{
    /// <summary>
    /// Fetches messages for <paramref name="conversationId"/> added after
    /// <paramref name="since"/> (or all when null), oldest-first.
    /// </summary>
    Task<IReadOnlyList<CrmMessage>> GetMessagesSinceAsync(
        string conversationId, DateTimeOffset? since, CancellationToken cancellationToken = default);
}
