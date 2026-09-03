using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IBlockTemplateService
{
    Task<List<BlockTemplateDto>> ListAsync(string? channel = null, bool includeArchived = false, CancellationToken ct = default);
    Task<BlockTemplateDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<BlockTemplateDto> CreateAsync(CreateBlockTemplateInput input, CancellationToken ct = default);
    Task<BlockTemplateDto?> UpdateAsync(Guid id, UpdateBlockTemplateInput input, CancellationToken ct = default);
    Task<bool> ArchiveAsync(Guid id, CancellationToken ct = default);
}
