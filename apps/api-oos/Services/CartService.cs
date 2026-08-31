namespace ApiOos.Services;

using ApiOos.DTOs.Requests.Cart;
using ApiOos.DTOs.Responses.Cart;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Mappers;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;

    public CartService(ICartRepository cartRepository, IProductRepository productRepository)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
    }

    public async Task<CartDto> GetCartAsync(Guid userId)
    {
        var cart = await _cartRepository.GetOrCreateCartAsync(userId);
        return CartMapper.ToDto(cart);
    }

    public async Task<CartDto> AddItemAsync(Guid userId, AddCartItemRequest request)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId);
        if (product == null || !product.IsActive)
        {
            throw new KeyNotFoundException("Product not found or unavailable.");
        }

        if (request.Quantity <= 0)
        {
            throw new InvalidOperationException("Quantity must be greater than zero.");
        }

        var cart = await _cartRepository.GetOrCreateCartAsync(userId);
        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
        var totalDesiredQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (totalDesiredQuantity > product.Stock)
        {
            throw new InvalidOperationException($"Insufficient stock available. Maximum stock is {product.Stock}.");
        }

        await _cartRepository.AddItemAsync(cart.Id, request.ProductId, request.Quantity);
        var updatedCart = await _cartRepository.GetByUserIdAsync(userId);
        return CartMapper.ToDto(updatedCart!);
    }

    public async Task<CartDto> UpdateItemAsync(Guid userId, Guid itemId, UpdateCartItemRequest request)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart == null)
        {
            throw new KeyNotFoundException("Cart not found.");
        }

        var item = cart.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null)
        {
            throw new KeyNotFoundException("Cart item not found.");
        }

        if (request.Quantity > 0)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product != null && request.Quantity > product.Stock)
            {
                throw new InvalidOperationException($"Insufficient stock available. Maximum stock is {product.Stock}.");
            }
        }

        await _cartRepository.UpdateItemQuantityAsync(itemId, request.Quantity);
        var updatedCart = await _cartRepository.GetByUserIdAsync(userId);
        return CartMapper.ToDto(updatedCart!);
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, Guid itemId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart != null)
        {
            await _cartRepository.RemoveItemAsync(itemId);
        }

        var updatedCart = await _cartRepository.GetByUserIdAsync(userId);
        return CartMapper.ToDto(updatedCart ?? await _cartRepository.GetOrCreateCartAsync(userId));
    }

    public async Task ClearCartAsync(Guid userId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart != null)
        {
            await _cartRepository.ClearCartAsync(cart.Id);
        }
    }
}
