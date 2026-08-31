namespace ApiOos.Hubs;

using ApiOos.DTOs.Chat;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.SignalR;

/// <summary>
/// Real-time chat hub hosted inside api-oos. The web-shop browser connects here and
/// nowhere else — never directly to api-crms. Customer messages are relayed to
/// api-crms via the Tickets webhook and broadcast back to the conversation group;
/// staff replies (fetched by the polling loop in #125) are relayed down the same
/// group.
/// </summary>
public sealed class ChatHub(IChatConversationService conversationService) : Hub
{
    public const string HubPath = "/hubs/chat";

    /// <summary>Joins the caller to a conversation's group so it receives its messages.</summary>
    public Task JoinConversation(string conversationId)
        => Groups.AddToGroupAsync(Context.ConnectionId, GroupName(conversationId));

    public Task LeaveConversation(string conversationId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(conversationId));

    /// <summary>
    /// Posts a customer chat message. The Identity Handshake email must be present —
    /// the conversation service rejects anonymous messages.
    /// </summary>
    public Task SendMessage(SendChatMessageInput input)
        => conversationService.HandleCustomerMessageAsync(input);

    /// <summary>Group name for a conversation. Shared with the broadcaster.</summary>
    public static string GroupName(string conversationId) => $"conversation:{conversationId}";
}
