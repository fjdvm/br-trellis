namespace ApiOos.Interfaces.Services;

/// <summary>
/// Tracks the chat conversations with a live browser connection so the staff-reply
/// polling loop knows which conversations to poll api-crms for. A conversation is
/// registered when a client joins its hub group and dropped when the last client
/// leaves.
/// </summary>
public interface IChatSessionRegistry
{
    /// <summary>Marks a conversation active (idempotent).</summary>
    void Register(string conversationId);

    /// <summary>Drops a conversation from the active set.</summary>
    void Unregister(string conversationId);

    /// <summary>Snapshot of currently-active conversation ids.</summary>
    IReadOnlyCollection<string> ActiveConversationIds { get; }

    /// <summary>The last message timestamp already relayed for a conversation, if any.</summary>
    DateTimeOffset? GetWatermark(string conversationId);

    /// <summary>Advances the relayed-up-to watermark for a conversation.</summary>
    void SetWatermark(string conversationId, DateTimeOffset watermark);
}
