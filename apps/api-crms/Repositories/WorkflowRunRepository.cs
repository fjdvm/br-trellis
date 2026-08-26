using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class WorkflowRunRepository(AppDbContext dbContext) : IWorkflowRunRepository
{
    public async Task<IReadOnlyList<WorkflowRun>> ListWorkflowRunsAsync(
        Guid? entityId, CancellationToken cancellationToken)
    {
        var query = dbContext.WorkflowRuns.AsNoTracking()
            .Include(r => r.Workflow)
                .ThenInclude(w => w.Steps)
            .AsSplitQuery()
            .AsQueryable();

        if (entityId.HasValue)
        {
            query = query.Where(r => r.EntityId == entityId.Value);
        }

        // SQLite cannot translate ORDER BY on DateTimeOffset, so order in memory.
        var runs = await query.ToListAsync(cancellationToken);
        return runs
            .OrderByDescending(r => r.StartedAt)
            .ToList();
    }

    public async Task<IReadOnlyDictionary<Guid, string>> GetCartLabelsByIdAsync(
        IReadOnlyList<Guid> cartIds, CancellationToken cancellationToken)
    {
        var carts = await dbContext.Carts.AsNoTracking()
            .Where(c => cartIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        return carts.ToDictionary(cart => cart.Id, cart => $"Cart {cart.PlatformCartId}");
    }
}
