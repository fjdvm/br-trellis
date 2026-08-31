namespace ApiOos.DTOs.Webhooks;

/// <summary>
/// Envelope for an ecommerce event sent to api-crms's Ecommerce webhook. Shape
/// matches api-crms's <c>EcommerceWebhookPayload</c> (EventId / EventType / Data).
/// </summary>
public sealed class EcommerceWebhookEvent
{
    public required string EventId { get; init; }
    public required string EventType { get; init; }
    public required EcommerceWebhookData Data { get; init; }
}

/// <summary>
/// Event data. A subset of api-crms's <c>EcommerceEventData</c> — only the fields
/// api-oos populates. <c>CustomerEmail</c> lets api-crms resolve the Contact via
/// Identity Resolution when no <c>ContactId</c> is supplied (#121).
/// </summary>
public sealed class EcommerceWebhookData
{
    // Order fields
    public string? OrderId { get; init; }
    public string? ContactId { get; init; }
    public string? CustomerEmail { get; init; }
    public string? Status { get; init; }
    public decimal? Total { get; init; }
    public decimal? RefundedAmount { get; init; }
    public IReadOnlyList<EcommerceWebhookLineItem>? LineItems { get; init; }

    // Cart fields
    public string? CartId { get; init; }
    public IReadOnlyList<EcommerceWebhookLineItem>? Items { get; init; }

    // Product fields
    public string? ProductId { get; init; }
    public string? Name { get; init; }
    public decimal? Price { get; init; }
    public bool? InStock { get; init; }

    // Common
    public string? OccurredAt { get; init; }
}

public sealed class EcommerceWebhookLineItem
{
    public required string ProductId { get; init; }
    public required string ProductName { get; init; }
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
}
