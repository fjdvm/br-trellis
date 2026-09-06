namespace ApiOos.Services;

using System.Collections.Concurrent;
using ApiOos.Interfaces.Services;

/// <summary>
/// Thread-safe in-memory registry of active chat conversations and their relayed-up-to
/// watermarks. A singleton — shared between the hub (which registers/unregisters on
/// join/leave) and the polling loop (which reads the active set).
/// </summary>
public sealed class InMemoryChatSessionRegistry : IChatSessionRegistry
{
    private readonly ConcurrentDictionary<string, DateTimeOffset?> _sessions = new();

    public void Register(string conversationId)
    {
        if (string.IsNullOrWhiteSpace(conversationId)) return;
        _sessions.TryAdd(conversationId, null);
    }

    public void Unregister(string conversationId)
    {
        _sessions.TryRemove(conversationId, out _);
    }

    public IReadOnlyCollection<string> ActiveConversationIds => _sessions.Keys.ToList();

    public DateTimeOffset? GetWatermark(string conversationId) =>
        _sessions.TryGetValue(conversationId, out var watermark) ? watermark : null;

    public void SetWatermark(string conversationId, DateTimeOffset watermark)
    {
        _sessions.AddOrUpdate(conversationId, watermark, (_, _) => watermark);
    }
}
