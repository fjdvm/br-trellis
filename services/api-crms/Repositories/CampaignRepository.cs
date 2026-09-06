using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class CampaignRepository(AppDbContext dbContext) : ICampaignRepository
{
    public async Task<IReadOnlyList<Campaign>> ListAsync(
        CampaignStatus? status,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Campaigns.AsNoTracking().AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        var campaigns = await query.ToListAsync(cancellationToken);
        // SQLite can't ORDER BY a DateTimeOffset column; order newest-first in memory.
        return campaigns
            .OrderByDescending(c => c.CreatedAt)
            .ToList();
    }

    public async Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Campaigns.AsNoTracking()
            .Include(c => c.ChannelContents)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
}
