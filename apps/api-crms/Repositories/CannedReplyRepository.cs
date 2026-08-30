using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class CannedReplyRepository(AppDbContext dbContext) : ICannedReplyRepository
{
    public async Task<IReadOnlyList<CannedReply>> ListRepliesAsync(
        bool includeArchived,
        Guid? categoryId,
        CancellationToken cancellationToken)
    {
        var query = dbContext.CannedReplies.AsNoTracking()
            .Include(r => r.Category)
            .AsQueryable();

        if (!includeArchived)
        {
            query = query.Where(r => r.DeletedAt == null);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(r => r.CategoryId == categoryId.Value);
        }

        return await query
            .OrderBy(r => r.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<CannedReply?> GetReplyByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.CannedReplies.AsNoTracking()
            .Where(r => r.Id == id)
            .Include(r => r.Category)
            .SingleOrDefaultAsync(cancellationToken);
    }
}
