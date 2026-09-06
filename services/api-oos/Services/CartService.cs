namespace ApiOos.Services;

using ApiOos.DTOs.Requests.Cart;
using ApiOos.DTOs.Responses.Cart;
using ApiOos.DTOs.Webhooks;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Mappers;
using Microsoft.Extensions.Logging;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUserRepository? _userRepository;
    private readonly IEcommerceWebhookClient? _ecommerceWebhookClient;
    private readonly ILogger<CartService>? _logger;

    public CartService(
        ICartRepository cartRepository,
        IProductRepository productRepository,
        IUserRepository? userRepository = null,
        IEcommerceWebhookClient? ecommerceWebhookClient = null,
        ILogger<CartService>? logger = null)
    {
        _cartRepository = cartRepository;
        _productRepository = productRepository;
        _userRepository = userRepository;
        _ecommerceWebhookClient = ecommerceWebhookClient;
        _logger = logger;
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
            throw new NotFoundException("Product not found or unavailable.");
        }

        if (request.Quantity <= 0)
        {
            throw new AppException("Quantity must be greater than zero.");
        }

        var cart = await _cartRepository.GetOrCreateCartAsync(userId);
        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
        var totalDesiredQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (totalDesiredQuantity > product.Stock)
        {
            throw new AppException($"Insufficient stock available. Maximum stock is {product.Stock}.");
        }

        await _cartRepository.AddItemAsync(cart.Id, request.ProductId, request.Quantity);
        var updatedCart = await _cartRepository.GetByUserIdAsync(userId);
        var dto = CartMapper.ToDto(updatedCart!);
        await DispatchCartUpdatedAsync(userId, dto);
        return dto;
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
        var dto = CartMapper.ToDto(updatedCart!);
        await DispatchCartUpdatedAsync(userId, dto);
        return dto;
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, Guid itemId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart != null)
        {
            await _cartRepository.RemoveItemAsync(itemId);
        }

        var updatedCart = await _cartRepository.GetByUserIdAsync(userId);
        var dto = CartMapper.ToDto(updatedCart ?? await _cartRepository.GetOrCreateCartAsync(userId));
        await DispatchCartUpdatedAsync(userId, dto);
        return dto;
    }

    public async Task ClearCartAsync(Guid userId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart != null)
        {
            await _cartRepository.ClearCartAsync(cart.Id);
        }
    }

    /// <summary>
    /// Emits a <c>cart.updated</c> event to api-crms's Ecommerce webhook so its
    /// cart-abandonment tracking sees live carts. Best-effort: failures are logged,
    /// never thrown. No-op when the outbound client isn't configured (unit tests).
    /// </summary>
    private async Task DispatchCartUpdatedAsync(Guid userId, CartDto cart)
    {
        if (_ecommerceWebhookClient is null)
        {
            return;
        }

        try
        {
            var user = _userRepository is null ? null : await _userRepository.GetByIdAsync(userId);
            var webhookEvent = new EcommerceWebhookEvent
            {
                EventId = Guid.NewGuid().ToString(),
                EventType = "cart.updated",
                Data = new EcommerceWebhookData
                {
                    CartId = cart.Id.ToString(),
                    CustomerEmail = user?.Email,
                    OccurredAt = DateTime.UtcNow.ToString("O"),
                    Items = cart.Items.Select(item => new EcommerceWebhookLineItem
                    {
                        ProductId = item.ProductId.ToString(),
                        ProductName = item.ProductName,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                    }).ToList(),
                },
            };

            await _ecommerceWebhookClient.SendAsync(webhookEvent);
        }
        catch (Exception exception)
        {
            _logger?.LogWarning(
                exception, "Failed to deliver cart.updated webhook for user {UserId}.", userId);
        }
    }
}
