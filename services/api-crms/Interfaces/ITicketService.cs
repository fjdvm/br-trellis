using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ITicketService
{
    Task<IReadOnlyList<TicketListItemDto>> ListTicketsAsync(
        string? status,
        string? waitingOn,
        string? source,
        CancellationToken cancellationToken);

    Task<TicketDetailDto?> GetTicketByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<TicketDetailDto> CreateTicketAsync(CreateTicketDto input, CancellationToken cancellationToken);

    Task<TicketDetailDto?> ClaimTicketAsync(Guid id, ClaimTicketDto input, CancellationToken cancellationToken);

    Task<TicketDetailDto?> UnclaimTicketAsync(Guid id, CancellationToken cancellationToken, string? callerId = null);

    Task<TicketDetailDto?> ChangeStatusAsync(Guid id, ChangeTicketStatusDto input, CancellationToken cancellationToken, string? callerId = null, string? actorLabel = null);

    Task<TicketDetailDto?> SetWaitingOnAsync(Guid id, SetWaitingOnDto input, CancellationToken cancellationToken, string? callerId = null);
}
