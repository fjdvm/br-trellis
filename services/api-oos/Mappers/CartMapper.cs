namespace ApiOos.Mappers;

using ApiOos.DTOs.Responses.Cart;
using ApiOos.Models;

public static class CartMapper
{
    public static CartDto ToDto(Cart cart)
    {
        return new CartDto
        {
            Id = cart.Id,
            UserId = cart.UserId,
            Items = cart.Items.Select(ToItemDto).ToList()
        };
    }

    public static CartItemDto ToItemDto(CartItem item)
    {
        return new CartItemDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.Product?.Name ?? string.Empty,
            ProductSKU = item.Product?.SKU ?? string.Empty,
            UnitPrice = item.Product?.Price ?? 0,
            Images = item.Product?.Images ?? new List<string>(),
            Quantity = item.Quantity,
            Stock = item.Product?.Stock ?? 0
        };
    }
}
