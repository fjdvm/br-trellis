namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Chat;

/// <summary>
/// Broadcasts chat messages to the clients connected to a conversation on the
/// api-oos chat hub. Abstracts <c>IHubContext</c> so the relay logic can be unit
/// tested without standing up a live SignalR connection.
/// </summary>
public interface IChatBroadcaster
{
    /// <summary>Delivers a message to every client in the conversation's group.</summary>
    Task BroadcastMessageAsync(
        string conversationId, ChatMessageDto message, CancellationToken cancellationToken = default);
}
