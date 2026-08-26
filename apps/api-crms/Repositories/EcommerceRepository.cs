using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class EcommerceRepository(AppDbContext dbContext) : IEcommerceRepository
{
    public async Task<bool> HasProcessedEventAsync(string eventId, CancellationToken cancellationToken)
    {
        return await dbContext.ProcessedEvents
            .AnyAsync(e => e.EventId == eventId, cancellationToken);
    }

    public async Task MarkEventProcessedAsync(
        string eventId, string eventType, CancellationToken cancellationToken)
    {
        dbContext.ProcessedEvents.Add(new ProcessedEvent
        {
            EventId = eventId,
            EventType = eventType,
            ProcessedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Order?> GetOrderByPlatformIdAsync(
        string platformOrderId, CancellationToken cancellationToken)
    {
        return await dbContext.Orders
            .Include(o => o.LineItems)
            .FirstOrDefaultAsync(o => o.PlatformOrderId == platformOrderId, cancellationToken);
    }

    public async Task<Cart?> GetCartByPlatformIdAsync(
        string platformCartId, CancellationToken cancellationToken)
    {
        return await dbContext.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.PlatformCartId == platformCartId, cancellationToken);
    }

    public async Task<Product?> GetProductByPlatformIdAsync(
        string platformProductId, CancellationToken cancellationToken)
    {
        return await dbContext.Products
            .FirstOrDefaultAsync(p => p.PlatformProductId == platformProductId, cancellationToken);
    }

    public async Task UpsertOrderAsync(Order order, CancellationToken cancellationToken)
    {
        var existing = await GetOrderByPlatformIdAsync(order.PlatformOrderId, cancellationToken);
        if (existing is null)
        {
            dbContext.Orders.Add(order);
        }
        else
        {
            existing.ContactId = order.ContactId;
            existing.Status = order.Status;
            existing.Total = order.Total;
            existing.RefundedAmount = order.RefundedAmount;
            existing.UpdatedAt = order.UpdatedAt;

            // Replace line items
            dbContext.OrderLineItems.RemoveRange(existing.LineItems);
            foreach (var item in order.LineItems)
            {
                item.OrderId = existing.Id;
                dbContext.OrderLineItems.Add(item);
            }
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpsertCartAsync(
        Cart cart, IReadOnlyList<CartItem> items, CancellationToken cancellationToken)
    {
        var existing = await GetCartByPlatformIdAsync(cart.PlatformCartId, cancellationToken);
        if (existing is null)
        {
            foreach (var item in items)
            {
                item.CartId = cart.Id;
                cart.Items.Add(item);
            }
            dbContext.Carts.Add(cart);
        }
        else
        {
            existing.ContactId = cart.ContactId;
            existing.LastActivityAt = cart.LastActivityAt;
            existing.UpdatedAt = cart.UpdatedAt;

            // Only update status if not already converted/abandoned by Trellis
            if (existing.Status == CartStatus.Active)
            {
                existing.Status = cart.Status;
            }

            // Replace items
            dbContext.CartItems.RemoveRange(existing.Items);
            foreach (var item in items)
            {
                item.CartId = existing.Id;
                dbContext.CartItems.Add(item);
            }
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpsertProductAsync(Product product, CancellationToken cancellationToken)
    {
        var existing = await GetProductByPlatformIdAsync(
            product.PlatformProductId, cancellationToken);
        if (existing is null)
        {
            dbContext.Products.Add(product);
        }
        else
        {
            existing.Name = product.Name;
            existing.Price = product.Price;
            existing.InStock = product.InStock;
            existing.UpdatedAt = product.UpdatedAt;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RecalculateLifetimeValueAsync(
        Guid contactId, CancellationToken cancellationToken)
    {
        var orders = await dbContext.Orders
            .Where(o => o.ContactId == contactId &&
                (o.Status == OrderStatus.Paid ||
                 o.Status == OrderStatus.Shipped ||
                 o.Status == OrderStatus.Delivered))
            .ToListAsync(cancellationToken);

        var ltv = orders.Sum(o => o.Total - o.RefundedAmount);
        if (ltv < 0) ltv = 0;

        var contact = await dbContext.Contacts
            .FirstAsync(c => c.Id == contactId, cancellationToken);
        contact.LifetimeValue = ltv;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AddTimelineEntryAsync(
        TimelineEntry entry, CancellationToken cancellationToken)
    {
        dbContext.TimelineEntries.Add(entry);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
