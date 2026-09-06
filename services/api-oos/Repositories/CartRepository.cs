namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class CartRepository : ICartRepository
{
    private readonly AppDbContext _context;

    public CartRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Cart?> GetByUserIdAsync(Guid userId)
    {
        return await _context.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);
    }

    public async Task<Cart> GetOrCreateCartAsync(Guid userId)
    {
        var cart = await GetByUserIdAsync(userId);
        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
        }
        return cart;
    }

    public async Task AddItemAsync(Guid cartId, Guid productId, int quantity)
    {
        var item = await _context.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cartId && ci.ProductId == productId);

        if (item != null)
        {
            item.Quantity += quantity;
            item.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            item = new CartItem
            {
                CartId = cartId,
                ProductId = productId,
                Quantity = quantity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.CartItems.Add(item);
        }
        await _context.SaveChangesAsync();
    }

    public async Task UpdateItemQuantityAsync(Guid cartItemId, int quantity)
    {
        var item = await _context.CartItems.FindAsync(cartItemId);
        if (item != null)
        {
            if (quantity <= 0)
            {
                _context.CartItems.Remove(item);
            }
            else
            {
                item.Quantity = quantity;
                item.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
        }
    }

    public async Task RemoveItemAsync(Guid cartItemId)
    {
        var item = await _context.CartItems.FindAsync(cartItemId);
        if (item != null)
        {
            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();
        }
    }

    public async Task ClearCartAsync(Guid cartId)
    {
        var items = await _context.CartItems.Where(i => i.CartId == cartId).ToListAsync();
        _context.CartItems.RemoveRange(items);
        await _context.SaveChangesAsync();
    }
}
