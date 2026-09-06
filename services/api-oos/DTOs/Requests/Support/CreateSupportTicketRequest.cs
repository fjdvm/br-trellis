namespace ApiOos.DTOs.Requests.Support;

/// <summary>
/// A shopper-submitted support ticket from the profile "Submit Ticket" dialog.
/// Relayed to api-crms's Tickets webhook as the opening message of a new
/// conversation. <c>Type</c> is one of Inquiry / Request / Complain.
/// </summary>
public sealed record CreateSupportTicketRequest(
    string Title,
    string Type,
    string Description);
