namespace ApiOos.DTOs.Responses.Cart;

public class CartItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public List<string> Images { get; set; } = new();
    public int Quantity { get; set; }
    public int Stock { get; set; }
    public decimal TotalPrice => UnitPrice * Quantity;
}
