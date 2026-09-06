namespace api_crms.DTOs;

public sealed record EcommerceWebhookPayload(
    string EventId,
    string EventType,
    EcommerceEventData Data);

public sealed record EcommerceEventData(
    // Order fields
    string? OrderId,
    string? ContactId,
    string? Status,
    decimal? Total,
    decimal? RefundedAmount,
    IReadOnlyList<EcommerceLineItemData>? LineItems,
    // Cart fields
    string? CartId,
    string? CustomerEmail,
    IReadOnlyList<EcommerceCartItemData>? Items,
    // Product fields
    string? ProductId,
    string? Name,
    decimal? Price,
    bool? InStock,
    // Common
    string? OccurredAt);

public sealed record EcommerceLineItemData(
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice);

public sealed record EcommerceCartItemData(
    string ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice);
