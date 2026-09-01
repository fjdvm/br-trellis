using api_crms.DTOs;
using api_crms.Interfaces;

namespace api_crms.Tests.Helpers;

/// <summary>
/// Hand-written <see cref="IConversationBroadcaster"/> test double that records
/// every call in-memory, mirroring api-oos's <c>FakeChatBroadcaster</c> convention.
/// Lets service tests assert real-time events fire (and with what payload) after
/// a write commits, without opening a live SignalR connection.
/// </summary>
public sealed class FakeConversationBroadcaster : IConversationBroadcaster
{
    public List<(Guid TicketId, MessageDto Message)> Messages { get; } = [];
    public List<TicketSummaryDto> NewTickets { get; } = [];
    public List<TicketSummaryDto> StatusChanges { get; } = [];

    public Task BroadcastMessageAsync(
        Guid ticketId, MessageDto message, CancellationToken cancellationToken = default)
    {
        Messages.Add((ticketId, message));
        return Task.CompletedTask;
    }

    public Task BroadcastNewTicketAsync(
        TicketSummaryDto ticket, CancellationToken cancellationToken = default)
    {
        NewTickets.Add(ticket);
        return Task.CompletedTask;
    }

    public Task BroadcastTicketStatusChangedAsync(
        TicketSummaryDto ticket, CancellationToken cancellationToken = default)
    {
        StatusChanges.Add(ticket);
        return Task.CompletedTask;
    }
}
