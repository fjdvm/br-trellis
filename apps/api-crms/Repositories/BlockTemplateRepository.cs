using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class BlockTemplateRepository(AppDbContext dbContext) : IBlockTemplateRepository
{
    public async Task<List<BlockTemplate>> ListAsync(string? channel = null, bool includeArchived = false, CancellationToken ct = default)
    {
        var query = dbContext.BlockTemplates
            .Include(t => t.Blocks)
            .AsNoTracking();

        if (!includeArchived)
        {
            query = query.Where(t => !t.IsArchived);
        }

        if (!string.IsNullOrWhiteSpace(channel) && Enum.TryParse<CampaignChannel>(channel.Trim(), true, out var parsedChannel))
        {
            query = query.Where(t => t.Channel == parsedChannel);
        }

        return await query
            .OrderBy(t => t.Channel)
            .ThenBy(t => t.Name)
            .ToListAsync(ct);
    }

    public async Task<BlockTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await dbContext.BlockTemplates
            .Include(t => t.Blocks)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
    }

    public async Task<BlockTemplate> CreateAsync(BlockTemplate template, CancellationToken ct = default)
    {
        dbContext.BlockTemplates.Add(template);
        await dbContext.SaveChangesAsync(ct);
        return template;
    }

    public async Task<BlockTemplate> UpdateAsync(BlockTemplate template, CancellationToken ct = default)
    {
        var existing = await dbContext.BlockTemplates
            .Include(t => t.Blocks)
            .FirstOrDefaultAsync(t => t.Id == template.Id, ct);

        if (existing is not null)
        {
            dbContext.TemplateBlocks.RemoveRange(existing.Blocks);
            existing.Name = template.Name;
            existing.Description = template.Description;
            existing.Channel = template.Channel;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
            existing.Blocks = template.Blocks;
            await dbContext.SaveChangesAsync(ct);
            return existing;
        }

        dbContext.BlockTemplates.Update(template);
        await dbContext.SaveChangesAsync(ct);
        return template;
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken ct = default)
    {
        var template = await dbContext.BlockTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template is null) return false;

        template.IsArchived = true;
        template.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);
        return true;
    }
}
