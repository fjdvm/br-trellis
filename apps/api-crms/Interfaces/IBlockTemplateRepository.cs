using api_crms.Models;

namespace api_crms.Interfaces;

public interface IBlockTemplateRepository
{
    Task<List<BlockTemplate>> ListAsync(string? channel = null, bool includeArchived = false, CancellationToken ct = default);
    Task<BlockTemplate?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<BlockTemplate> CreateAsync(BlockTemplate template, CancellationToken ct = default);
    Task<BlockTemplate> UpdateAsync(BlockTemplate template, CancellationToken ct = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken ct = default);
}
