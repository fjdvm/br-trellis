using api_crms.Enums;

namespace api_crms.Models;

public sealed class Order
{
    public Guid Id { get; set; }
    public string PlatformOrderId { get; set; } = string.Empty;
    public Guid ContactId { get; set; }
    public OrderStatus Status { get; set; }
    public decimal Total { get; set; }
    public decimal RefundedAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Contact Contact { get; set; } = null!;
    public ICollection<OrderLineItem> LineItems { get; } = new List<OrderLineItem>();
}
