namespace ApiOos.Services;

using ApiOos.DTOs.Chat;
using ApiOos.DTOs.Webhooks;
using ApiOos.Interfaces.Services;

/// <summary>
/// api-oos-side chat orchestration. A customer message is broadcast to the
/// conversation's connected browsers (so the sender and any staff/relay clients see
/// it) and relayed to api-crms via the Tickets webhook, which creates or appends to
/// the Conversation. The browser only ever talks to api-oos — never to api-crms.
/// </summary>
public sealed class ChatConversationService(
    IChatBroadcaster broadcaster,
    ITicketWebhookClient ticketWebhookClient) : IChatConversationService
{
    public async Task<ChatMessageDto> HandleCustomerMessageAsync(
        SendChatMessageInput input, CancellationToken cancellationToken = default)
    {
        var conversationId = Require(input.ConversationId, nameof(input.ConversationId));
        var content = Require(input.Content, nameof(input.Content));

        // Identity Handshake gate: no fully-anonymous messaging.
        var email = input.CustomerEmail?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException(
                "A customer email (Identity Handshake) is required before sending a message.",
                nameof(input.CustomerEmail));
        }

        var now = DateTimeOffset.UtcNow;
        var message = new ChatMessageDto
        {
            Id = Guid.NewGuid().ToString(),
            ConversationId = conversationId,
            SenderId = email,
            SenderName = input.CustomerName,
            // "user" is the shop customer's own self-marker — the same vocabulary the
            // server-hydrated history uses (Contact → "user"). Keeping the live echo
            // and the reloaded history in sync is what lets the web-shop align the
            // customer's own messages to the right without needing a refresh.
            SenderType = "user",
            Content = content,
            SentAt = now.ToString("O"),
        };

        // (a) Relay to api-crms — creates the Conversation on first message, appends after.
        await ticketWebhookClient.SendAsync(new TicketWebhookEvent
        {
            EventId = Guid.NewGuid().ToString(),
            EventType = "ticket.message.received",
            Data = new TicketWebhookData
            {
                ConversationId = conversationId,
                CustomerEmail = email,
                CustomerName = input.CustomerName,
                MessageBody = content,
                Subject = "Shop chat",
                OccurredAt = now.ToString("O"),
            },
        }, cancellationToken);

        // (b) Broadcast to the conversation's connected browsers.
        await broadcaster.BroadcastMessageAsync(conversationId, message, cancellationToken);

        return message;
    }

    private static string Require(string? value, string name)
    {
        return string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("A value is required.", name)
            : value.Trim();
    }
}
