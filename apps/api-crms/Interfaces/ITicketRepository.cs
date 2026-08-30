using api_crms.Enums;
using api_crms.Models;

namespace api_crms.Interfaces;

public interface ITicketRepository
{
    Task<IReadOnlyList<Ticket>> ListTicketsAsync(
        TicketStatus? status,
        WaitingOn? waitingOn,
        TicketSource? source,
        CancellationToken cancellationToken);

    Task<Ticket?> GetTicketByIdAsync(Guid id, CancellationToken cancellationToken);

    Task AddTicketAsync(Ticket ticket, CancellationToken cancellationToken);

    Task<bool> ContactExistsAsync(Guid contactId, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
