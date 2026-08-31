namespace ApiOos.DTOs.Requests.Cart;

public class AddCartItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; } = 1;
}
