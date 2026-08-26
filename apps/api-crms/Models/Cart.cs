using api_crms.Enums;

namespace api_crms.Models;

public sealed class Cart
{
    public Guid Id { get; set; }
    public string PlatformCartId { get; set; } = string.Empty;
    public Guid? ContactId { get; set; }
    public CartStatus Status { get; set; }
    public DateTimeOffset LastActivityAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Contact? Contact { get; set; }
    public ICollection<CartItem> Items { get; } = new List<CartItem>();
}
