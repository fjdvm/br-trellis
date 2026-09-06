namespace api_crms.DTOs;

public sealed record MessageDto(
    Guid Id,
    Guid TicketId,
    string SenderType,
    Guid? SenderContactId,
    string? SenderStaffId,
    string? SenderStaffName,
    string Content,
    DateTimeOffset SentAt);

public sealed record PostMessageDto(
    string SenderType,
    Guid? SenderContactId,
    string? SenderStaffId,
    string? SenderStaffName,
    string Content);
