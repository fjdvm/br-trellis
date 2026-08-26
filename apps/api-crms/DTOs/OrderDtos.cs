namespace api_crms.DTOs;

public sealed record OrderListItemDto(
    Guid Id,
    string PlatformOrderId,
    Guid ContactId,
    string? ContactName,
    string? ContactEmail,
    string Status,
    decimal Total,
    decimal RefundedAmount,
    DateTimeOffset CreatedAt,
    int LineItemCount);
