using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;

namespace api_crms.Mappers;

public static class BlockTemplateMapper
{
    public static BlockTemplateDto ToDto(BlockTemplate template)
    {
        return new BlockTemplateDto(
            template.Id,
            template.Name,
            template.Description,
            template.Channel.ToString(),
            template.IsArchived,
            template.Theme.ToString(),
            template.CreatedAt,
            template.UpdatedAt,
            template.Blocks
                .OrderBy(b => b.Order)
                .Select(b => new TemplateBlockDto(
                    b.Id,
                    b.Type,
                    b.Label,
                    b.Order,
                    b.TextAlign,
                    b.IsBold,
                    b.IsItalic,
                    b.Content))
                .ToList());
    }

    public static BlockTemplate ToModel(CreateBlockTemplateInput input, CampaignChannel channel, EmailTheme theme)
    {
        var now = DateTimeOffset.UtcNow;
        var template = new BlockTemplate
        {
            Id = Guid.NewGuid(),
            Name = input.Name.Trim(),
            Description = input.Description?.Trim(),
            Channel = channel,
            IsArchived = false,
            Theme = theme,
            CreatedAt = now,
            UpdatedAt = now,
        };

        template.Blocks = input.Blocks
            .Select((b, index) => new TemplateBlock
            {
                Id = Guid.NewGuid(),
                BlockTemplateId = template.Id,
                Type = b.Type.Trim().ToLowerInvariant(),
                Label = string.IsNullOrWhiteSpace(b.Label) ? $"{b.Type} block" : b.Label.Trim(),
                Order = b.Order >= 0 ? b.Order : index,
                TextAlign = string.IsNullOrWhiteSpace(b.TextAlign) ? "left" : b.TextAlign.Trim().ToLowerInvariant(),
                IsBold = b.IsBold ?? false,
                IsItalic = b.IsItalic ?? false,
                Content = b.Content,
            })
            .ToList();

        return template;
    }
}
