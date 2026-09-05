using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;
using api_crms.Validators;

namespace api_crms.Services;

public sealed class BlockTemplateService(IBlockTemplateRepository repository) : IBlockTemplateService
{
    public async Task<List<BlockTemplateDto>> ListAsync(string? channel = null, bool includeArchived = false, CancellationToken ct = default)
    {
        var templates = await repository.ListAsync(channel, includeArchived, ct);
        return templates.Select(BlockTemplateMapper.ToDto).ToList();
    }

    public async Task<BlockTemplateDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var template = await repository.GetByIdAsync(id, ct);
        return template is null ? null : BlockTemplateMapper.ToDto(template);
    }

    public async Task<BlockTemplateDto> CreateAsync(CreateBlockTemplateInput input, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new ArgumentException("BlockTemplate name is required.");
        }

        if (!Enum.TryParse<CampaignChannel>(input.Channel?.Trim(), true, out var channel))
        {
            throw new ArgumentException($"Invalid channel '{input.Channel}'.");
        }

        var (isValid, errorMessage) = BlockTemplateValidator.ValidateConstraints(channel, input.Blocks ?? []);
        if (!isValid)
        {
            throw new InvalidOperationException(errorMessage);
        }

        var model = BlockTemplateMapper.ToModel(input, channel);
        var created = await repository.CreateAsync(model, ct);
        return BlockTemplateMapper.ToDto(created);
    }

    public async Task<BlockTemplateDto?> UpdateAsync(Guid id, UpdateBlockTemplateInput input, CancellationToken ct = default)
    {
        var existing = await repository.GetByIdAsync(id, ct);
        if (existing is null)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new ArgumentException("BlockTemplate name is required.");
        }

        if (!Enum.TryParse<CampaignChannel>(input.Channel?.Trim(), true, out var channel))
        {
            throw new ArgumentException($"Invalid channel '{input.Channel}'.");
        }

        var (isValid, errorMessage) = BlockTemplateValidator.ValidateConstraints(channel, input.Blocks ?? []);
        if (!isValid)
        {
            throw new InvalidOperationException(errorMessage);
        }

        existing.Name = input.Name.Trim();
        existing.Description = input.Description?.Trim();
        existing.Channel = channel;
        existing.UpdatedAt = DateTimeOffset.UtcNow;

        var newBlocks = (input.Blocks ?? [])
            .Select((b, index) => new TemplateBlock
            {
                Id = Guid.NewGuid(),
                BlockTemplateId = existing.Id,
                Type = b.Type.Trim().ToLowerInvariant(),
                Label = string.IsNullOrWhiteSpace(b.Label) ? $"{b.Type} block" : b.Label.Trim(),
                Order = b.Order >= 0 ? b.Order : index,
                TextAlign = string.IsNullOrWhiteSpace(b.TextAlign) ? "left" : b.TextAlign.Trim().ToLowerInvariant(),
                IsBold = b.IsBold ?? false,
                IsItalic = b.IsItalic ?? false,
                Content = b.Content,
            })
            .ToList();

        existing.Blocks = newBlocks;

        var updated = await repository.UpdateAsync(existing, ct);
        return BlockTemplateMapper.ToDto(updated);
    }

    public async Task<bool> ArchiveAsync(Guid id, CancellationToken ct = default)
    {
        return await repository.ArchiveAsync(id, ct);
    }
}
