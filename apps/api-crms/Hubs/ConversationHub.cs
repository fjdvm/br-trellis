using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace api_crms.Hubs;

/// <summary>
/// Real-time Conversations hub hosted directly in api-crms. web-crms connects
/// here as an already-authenticated staff client, over the same JWT bearer
/// scheme api-crms terminates for its agent-facing REST API — see ADR 0004
/// (<c>docs/adr/0004-agent-signalr-hub-lives-in-crms.md</c>) for why this hub lives
/// here rather than being relayed through api-oos like the customer-facing
/// <c>ChatHub</c>. <see cref="AuthorizeAttribute"/> rejects any connection without a
/// valid staff token (the token arrives via the SignalR-over-JWT query-string
/// pattern, wired in <c>Program.cs</c>).
///
/// Two group scopes:
/// <list type="bullet">
/// <item>The single shared <see cref="StaffGroup"/> receives ticket-list events
/// (a new ticket, a status/waiting-on change) — joined via <see cref="JoinStaff"/>.</item>
/// <item>A per-ticket group (<see cref="TicketGroupName"/>) receives message events
/// for one thread — joined via <see cref="JoinTicket"/>.</item>
/// </list>
/// The client method names below are fixed by web-crms's pre-existing
/// <c>useSignalR.test.ts</c> contract — do not rename them.
/// </summary>
[Authorize]
public sealed class ConversationHub : Hub
{
    public const string HubPath = "/hubs/conversations";

    /// <summary>The shared group every connected agent joins for ticket-list events.</summary>
    public const string StaffGroup = "Staff";

    /// <summary>Joins the caller to the shared staff group for ticket-list events.</summary>
    public Task JoinStaff() =>
        Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);

    /// <summary>Leaves the shared staff group.</summary>
    public Task LeaveStaff() =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, StaffGroup);

    /// <summary>Joins the caller to a ticket's thread group so it receives that
    /// ticket's message events.</summary>
    public Task JoinTicket(string ticketId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, TicketGroupName(ticketId));

    /// <summary>Leaves a ticket's thread group.</summary>
    public Task LeaveTicket(string ticketId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, TicketGroupName(ticketId));

    /// <summary>Group name for a ticket's message thread. Shared with the broadcaster.</summary>
    public static string TicketGroupName(Guid ticketId) => $"Ticket:{ticketId}";

    private static string TicketGroupName(string ticketId) => $"Ticket:{ticketId}";
}
