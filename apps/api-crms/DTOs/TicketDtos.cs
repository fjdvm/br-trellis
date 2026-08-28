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
    string? AssignedToId,
    string? AssignedToName,
    string? AssignedToEmail,
    Guid? ContactId,
    TicketContactDto? Contact,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateTicketDto(
    string Subject,
    Guid? ContactId);

public sealed record ClaimTicketDto(
    string StaffId,
    string StaffName,
    string StaffEmail);

public sealed record ChangeTicketStatusDto(
    string Status);

public sealed record SetWaitingOnDto(
    string WaitingOn);
