using api_crms.DTOs;
using api_crms.Hubs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace api_crms.Services;

/// <summary>
/// The production <see cref="IConversationBroadcaster"/>: pushes events over the
/// SignalR <see cref="ConversationHub"/>. Message events go to the per-ticket
/// group; ticket-list events go to the shared <see cref="ConversationHub.StaffGroup"/>.
/// The client event names (<c>ReceiveMessage</c>/<c>NewTicketAvailable</c>/
/// <c>TicketStatusChanged</c>) match web-crms's <c>useSignalR</c> handlers.
/// </summary>
public sealed class SignalRConversationBroadcaster(IHubContext<ConversationHub> hubContext)
    : IConversationBroadcaster
{
    public Task BroadcastMessageAsync(
        Guid ticketId, MessageDto message, CancellationToken cancellationToken = default) =>
        hubContext.Clients
            .Group(ConversationHub.TicketGroupName(ticketId))
            .SendAsync("ReceiveMessage", message, cancellationToken);

    public Task BroadcastNewTicketAsync(
        TicketSummaryDto ticket, CancellationToken cancellationToken = default) =>
        hubContext.Clients
            .Group(ConversationHub.StaffGroup)
            .SendAsync("NewTicketAvailable", ticket, cancellationToken);

    public Task BroadcastTicketStatusChangedAsync(
        TicketSummaryDto ticket, CancellationToken cancellationToken = default) =>
        hubContext.Clients
            .Group(ConversationHub.StaffGroup)
            .SendAsync("TicketStatusChanged", ticket, cancellationToken);
}
