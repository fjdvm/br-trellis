namespace ApiOos.Services;

using ApiOos.DTOs.Chat;
using ApiOos.Interfaces.Services;

/// <summary>
/// Polls api-crms for new messages on each active chat conversation and relays any
/// staff replies down the hub to the connected browser. This poll is the only way a
/// staff reply reaches the customer — api-crms never calls out (ADR 0002). Customer
/// messages are echoed by the hub at send time, so only staff-authored messages are
/// relayed here (avoiding duplicates).
/// </summary>
public sealed class StaffReplyRelayService(
    IChatSessionRegistry registry,
    ICrmMessageReader messageReader,
    IChatBroadcaster broadcaster)
{
    private const string StaffSenderType = "Staff";

    public async Task PollOnceAsync(CancellationToken cancellationToken)
    {
        foreach (var conversationId in registry.ActiveConversationIds)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await PollConversationAsync(conversationId, cancellationToken);
        }
    }

    private async Task PollConversationAsync(string conversationId, CancellationToken cancellationToken)
    {
        var since = registry.GetWatermark(conversationId);
        var messages = await messageReader.GetMessagesSinceAsync(conversationId, since, cancellationToken);
        if (messages.Count == 0)
        {
            return;
        }

        var highWater = since;
        foreach (var message in messages.OrderBy(m => m.SentAt))
        {
            // Track the watermark across all fetched messages (staff and contact) so we
            // never re-fetch or double-relay.
            if (highWater is null || message.SentAt > highWater.Value)
            {
                highWater = message.SentAt;
            }

            if (!string.Equals(message.SenderType, StaffSenderType, StringComparison.OrdinalIgnoreCase))
            {
                continue; // Customer messages are already shown by the sending browser.
            }

            await broadcaster.BroadcastMessageAsync(conversationId, new ChatMessageDto
            {
                Id = message.Id,
                ConversationId = conversationId,
                SenderId = "staff",
                SenderName = message.SenderStaffName,
                SenderType = "agent",
                Content = message.Content,
                SentAt = message.SentAt.ToString("O"),
            }, cancellationToken);
        }

        if (highWater is not null)
        {
            registry.SetWatermark(conversationId, highWater.Value);
        }
    }
}
