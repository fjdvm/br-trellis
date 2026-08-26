using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class CartRepository(AppDbContext dbContext) : ICartRepository
{
    public async Task<IReadOnlyList<Cart>> ListCartsAsync(
        CartStatus? status, CancellationToken cancellationToken)
    {
        var query = dbContext.Carts.AsNoTracking()
            .Include(c => c.Contact)
            .Include(c => c.Items)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        // SQLite cannot translate ORDER BY on DateTimeOffset, so order in memory.
        var carts = await query.ToListAsync(cancellationToken);
        return carts.OrderByDescending(c => c.LastActivityAt).ToList();
    }

    public async Task<IReadOnlyDictionary<Guid, WorkflowRun>> GetActiveWorkflowRunsByEntityIdAsync(
        IReadOnlyList<Guid> cartIds, CancellationToken cancellationToken)
    {
        var runs = await dbContext.WorkflowRuns.AsNoTracking()
            .Include(r => r.Workflow)
                .ThenInclude(w => w.Steps)
            .Where(r => r.EntityType == "Cart"
                && cartIds.Contains(r.EntityId)
                && r.Status == WorkflowRunStatus.Running)
            .ToListAsync(cancellationToken);

        return runs.ToDictionary(r => r.EntityId, r => r);
    }
}
