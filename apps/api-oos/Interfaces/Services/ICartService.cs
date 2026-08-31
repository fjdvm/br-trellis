namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests.Cart;
using ApiOos.DTOs.Responses.Cart;

public interface ICartService
{
    Task<CartDto> GetCartAsync(Guid userId);
    Task<CartDto> AddItemAsync(Guid userId, AddCartItemRequest request);
    Task<CartDto> UpdateItemAsync(Guid userId, Guid itemId, UpdateCartItemRequest request);
    Task<CartDto> RemoveItemAsync(Guid userId, Guid itemId);
    Task ClearCartAsync(Guid userId);
}
