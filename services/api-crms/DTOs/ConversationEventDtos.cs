namespace api_crms.DTOs;

/// <summary>
/// The small ticket-summary payload carried by the hub's ticket-list-level
/// events (<c>NewTicketAvailable</c>/<c>TicketStatusChanged</c>), broadcast to the
/// <c>Staff</c> group. Carries just enough for <c>ConversationsInbox</c> to render or
/// update a row without a follow-up fetch (Id, Status, WaitingOn, Subject,
/// AssignedTo*), plus the contact + timestamps the Inbox already displays.
/// </summary>
public sealed record TicketSummaryDto(
    Guid Id,
    string Subject,
    string Status,
    string WaitingOn,
    string Source,
    string? AssignedToId,
    string? AssignedToName,
    string? AssignedToEmail,
    Guid? ContactId,
    TicketContactDto? Contact,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
