using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class CannedReplyCategoryRepository(AppDbContext dbContext)
    : ICannedReplyCategoryRepository
{
    public async Task<IReadOnlyList<CannedReplyCategory>> ListCategoriesAsync(
        bool includeArchived,
        CancellationToken cancellationToken)
    {
        var query = dbContext.CannedReplyCategories.AsNoTracking()
            .Include(c => c.CannedReplies.Where(r => r.DeletedAt == null))
            .AsQueryable();

        if (!includeArchived)
        {
            query = query.Where(c => c.DeletedAt == null);
        }

        return await query
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<CannedReplyCategory?> GetCategoryByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        return await dbContext.CannedReplyCategories.AsNoTracking()
            .Where(c => c.Id == id)
            .Include(c => c.CannedReplies.Where(r => r.DeletedAt == null))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
