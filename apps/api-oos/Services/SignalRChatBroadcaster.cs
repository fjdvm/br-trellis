namespace ApiOos.Services;

using ApiOos.DTOs.Chat;
using ApiOos.Hubs;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.SignalR;

/// <summary>
/// Broadcasts chat messages over the SignalR <see cref="ChatHub"/> to every client in
/// a conversation's group, via the "ReceiveMessage" client event.
/// </summary>
public sealed class SignalRChatBroadcaster(IHubContext<ChatHub> hubContext) : IChatBroadcaster
{
    public async Task BroadcastMessageAsync(
        string conversationId, ChatMessageDto message, CancellationToken cancellationToken = default)
    {
        await hubContext.Clients
            .Group(ChatHub.GroupName(conversationId))
            .SendAsync("ReceiveMessage", message, cancellationToken);
    }
}
