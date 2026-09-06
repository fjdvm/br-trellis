using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class TemplateRepository(AppDbContext dbContext) : ITemplateRepository
{
    public async Task<IReadOnlyList<Template>> ListAsync(
        CampaignChannel? channel,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Templates.AsNoTracking().AsQueryable();

        if (channel.HasValue)
        {
            query = query.Where(t => t.Channel == channel.Value);
        }

        return await query
            .OrderBy(t => t.Channel)
            .ThenBy(t => t.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Template?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Templates.AsNoTracking()
            .SingleOrDefaultAsync(t => t.Id == id, cancellationToken);
    }
}
