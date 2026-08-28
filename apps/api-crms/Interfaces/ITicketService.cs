using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ITicketService
{
    Task<IReadOnlyList<TicketListItemDto>> ListTicketsAsync(
        string? status,
        string? waitingOn,
        CancellationToken cancellationToken);

    Task<TicketDetailDto?> GetTicketByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<TicketDetailDto> CreateTicketAsync(CreateTicketDto input, CancellationToken cancellationToken);
}
