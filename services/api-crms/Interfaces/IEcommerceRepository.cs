using api_crms.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace api_crms.Interfaces;

public interface IEcommerceRepository
{
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken);

    Task<bool> HasProcessedEventAsync(string eventId, CancellationToken cancellationToken);

    Task MarkEventProcessedAsync(string eventId, string eventType, CancellationToken cancellationToken);

    Task<Order?> GetOrderByPlatformIdAsync(string platformOrderId, CancellationToken cancellationToken);

    Task<Cart?> GetCartByPlatformIdAsync(string platformCartId, CancellationToken cancellationToken);

    Task<Product?> GetProductByPlatformIdAsync(string platformProductId, CancellationToken cancellationToken);

    Task UpsertOrderAsync(Order order, CancellationToken cancellationToken);

    Task UpsertCartAsync(Cart cart, IReadOnlyList<CartItem> items, CancellationToken cancellationToken);

    Task UpsertProductAsync(Product product, CancellationToken cancellationToken);

    Task RecalculateLifetimeValueAsync(Guid contactId, CancellationToken cancellationToken);

    Task AddTimelineEntryAsync(TimelineEntry entry, CancellationToken cancellationToken);

    Task UpdateSyncStatusAsync(CancellationToken cancellationToken);

    Task<EcommerceSyncStatus?> GetSyncStatusAsync(CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
