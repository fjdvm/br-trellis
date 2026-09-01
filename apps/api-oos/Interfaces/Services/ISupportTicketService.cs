namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests.Support;
using ApiOos.DTOs.Responses;

/// <summary>
/// Creates a shopper-submitted support ticket by relaying it to api-crms's Tickets
/// webhook as the opening message of a new conversation. api-oos owns no ticket
/// storage — the CRM is the system of record.
/// </summary>
public interface ISupportTicketService
{
    Task<SupportTicketResponseDto> CreateAsync(
        Guid userId,
        CreateSupportTicketRequest request,
        CancellationToken cancellationToken = default);
}
