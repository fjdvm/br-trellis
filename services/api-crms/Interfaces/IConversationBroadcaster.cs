using api_crms.DTOs;

namespace api_crms.Interfaces;

/// <summary>
/// Broadcasts Conversations real-time events to connected staff clients on the
/// api-crms <c>ConversationHub</c>. Mirrors api-oos's <c>IChatBroadcaster</c>: it
/// abstracts <c>IHubContext</c> so the write paths (staff reply, inbound email,
/// inbound shop-chat, ticket status changes) can be unit-tested against a fake
/// without standing up a live SignalR connection.
///
/// Two scopes of event:
/// <list type="bullet">
/// <item><b>Message events</b> (<c>ReceiveMessage</c>) go only to agents currently
/// viewing a specific ticket's thread (the <c>Ticket:{ticketId}</c> group).</item>
/// <item><b>Ticket-list events</b> (<c>NewTicketAvailable</c>/<c>TicketStatusChanged</c>)
/// go to every connected agent (the shared <c>Staff</c> group), so the Inbox
/// reflects a new or changed ticket without opening it.</item>
/// </list>
/// Every call is made only after the originating write has committed — a
/// rolled-back write never broadcasts.
/// </summary>
public interface IConversationBroadcaster
{
    /// <summary>
    /// Delivers a new message to every client viewing its ticket's thread
    /// (the <c>Ticket:{ticketId}</c> group), via the <c>ReceiveMessage</c> client event.
    /// </summary>
    Task BroadcastMessageAsync(
        Guid ticketId, MessageDto message, CancellationToken cancellationToken = default);

    /// <summary>
    /// Announces a newly-created ticket to all connected agents (the <c>Staff</c>
    /// group), via the <c>NewTicketAvailable</c> client event.
    /// </summary>
    Task BroadcastNewTicketAsync(
        TicketSummaryDto ticket, CancellationToken cancellationToken = default);

    /// <summary>
    /// Announces a ticket's Status/WaitingOn/assignment change to all connected
    /// agents (the <c>Staff</c> group), via the <c>TicketStatusChanged</c> client event.
    /// </summary>
    Task BroadcastTicketStatusChangedAsync(
        TicketSummaryDto ticket, CancellationToken cancellationToken = default);
}
