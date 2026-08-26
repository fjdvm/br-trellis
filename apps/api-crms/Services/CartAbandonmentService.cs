using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed class CartAbandonmentService(
    AppDbContext dbContext,
    CartAbandonmentOptions options) : ICartAbandonmentService
{
    /// <summary>
    /// Sweeps active carts and flags those that meet abandonment criteria:
    /// - Has at least one item
    /// - Has an identifiable contact (ContactId is not null)
    /// - No Order exists from this cart (using platform cart→order link via contact)
    /// - Inactive for longer than the configured threshold
    /// Returns cart IDs that were newly flagged as abandoned.
    /// </summary>
    public async Task<IReadOnlyList<Guid>> SweepAbandonedCartsAsync(
        CancellationToken cancellationToken = default)
    {
        var threshold = DateTimeOffset.UtcNow - options.AbandonmentThreshold;

        // Load all active carts and filter in memory (safe at expected scale)
        var activeCarts = await dbContext.Carts
            .Include(c => c.Items)
            .Where(c => c.Status == CartStatus.Active)
            .ToListAsync(cancellationToken);

        var candidateCarts = activeCarts
            .Where(c => c.ContactId != null
                && c.LastActivityAt <= threshold
                && c.Items.Count > 0)
            .ToList();

        var abandonedCartIds = new List<Guid>();

        foreach (var cart in candidateCarts)
        {
            // Check no order exists for this contact that was created after the cart
            var contactId = cart.ContactId!.Value;
            var cartCreatedAt = cart.CreatedAt;
            var hasOrder = await dbContext.Orders
                .Where(o => o.ContactId == contactId)
                .AnyAsync(cancellationToken);

            if (hasOrder) continue;

            cart.Status = CartStatus.Abandoned;
            abandonedCartIds.Add(cart.Id);
        }

        if (abandonedCartIds.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return abandonedCartIds;
    }
}

public sealed class CartAbandonmentOptions
{
    /// <summary>
    /// How long a cart must be inactive before it's flagged as abandoned.
    /// Default: 1 hour.
    /// </summary>
    public TimeSpan AbandonmentThreshold { get; init; } = TimeSpan.FromHours(1);

    /// <summary>
    /// How often the sweep runs. Default: 15 minutes.
    /// </summary>
    public TimeSpan SweepInterval { get; init; } = TimeSpan.FromMinutes(15);
}
