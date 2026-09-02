namespace api_crms.DTOs;

public sealed record TicketContactDto(
    Guid Id,
    string? Name,
    string? Email);

public sealed record TicketListItemDto(
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

public sealed record TicketDetailDto(
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
    DateTimeOffset UpdatedAt,
    string? CanceledBy = null);

public sealed record CreateTicketDto(
    string Subject,
    // Accepted as a raw string (not Guid?) so a form that sends an empty/blank
    // value for "no contact selected" doesn't trip System.Text.Json's Guid
    // binder (which 400s on ""). The service normalizes: blank -> no contact,
    // a valid Guid -> linked contact, anything else -> a clear ArgumentException.
    string? ContactId);

public sealed record ClaimTicketDto(
    string StaffId,
    string StaffName,
    string StaffEmail);

public sealed record ChangeTicketStatusDto(
    string Status);

public sealed record SetWaitingOnDto(
    string WaitingOn);
