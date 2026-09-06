namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Chat;

/// <summary>
/// Orchestrates a shop-chat conversation on the api-oos side: broadcasts messages to
/// connected browsers over the hub and relays customer messages onward to api-crms
/// via the Tickets webhook. Kept separate from the SignalR <c>ChatHub</c> so its
/// behaviour is unit-testable.
/// </summary>
public interface IChatConversationService
{
    /// <summary>
    /// Handles a customer chat message: broadcasts it to the conversation's connected
    /// clients and delivers it to api-crms. Throws <see cref="System.ArgumentException"/>
    /// when the Identity Handshake email is missing (no fully-anonymous messaging).
    /// </summary>
    Task<ChatMessageDto> HandleCustomerMessageAsync(
        SendChatMessageInput input, CancellationToken cancellationToken = default);
}
