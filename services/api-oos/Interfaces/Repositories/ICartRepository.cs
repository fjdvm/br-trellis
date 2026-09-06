namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdAsync(Guid userId);
    Task<Cart> GetOrCreateCartAsync(Guid userId);
    Task AddItemAsync(Guid cartId, Guid productId, int quantity);
    Task UpdateItemQuantityAsync(Guid cartItemId, int quantity);
    Task RemoveItemAsync(Guid cartItemId);
    Task ClearCartAsync(Guid cartId);
}
