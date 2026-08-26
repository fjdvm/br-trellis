using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class OrderRepository(AppDbContext dbContext) : IOrderRepository
{
    public async Task<IReadOnlyList<Order>> ListOrdersAsync(CancellationToken cancellationToken)
    {
        // SQLite cannot translate ORDER BY on DateTimeOffset, so order in memory.
        var orders = await dbContext.Orders.AsNoTracking()
            .Include(o => o.Contact)
            .Include(o => o.LineItems)
            .ToListAsync(cancellationToken);

        return orders.OrderByDescending(o => o.CreatedAt).ToList();
    }
}
