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

    /// <summary>
    /// Cancels a customer's own support ticket by relaying a <c>ticket.canceled</c>
    /// event to api-crms's Tickets webhook. Ownership is verified server-side first
    /// (only the owning Contact may cancel); a ticket the caller doesn't own or that
    /// doesn't exist is not relayed. Returns <c>true</c> when the cancellation was
    /// relayed, <c>false</c> when the caller may not cancel this ticket.
    /// </summary>
    Task<bool> CancelAsync(
        Guid userId,
        string ticketId,
        CancellationToken cancellationToken = default);
}
