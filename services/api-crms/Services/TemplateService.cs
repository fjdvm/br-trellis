using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class TemplateService(ITemplateRepository templateRepository) : ITemplateService
{
    public async Task<IReadOnlyList<TemplateDto>> ListTemplatesAsync(
        string? channel,
        CancellationToken cancellationToken)
    {
        CampaignChannel? channelFilter = null;
        if (!string.IsNullOrWhiteSpace(channel))
        {
            // An unrecognized channel string means "no template matches", not an
            // error — the gallery just shows nothing for that tab.
            if (!Enum.TryParse<CampaignChannel>(channel.Trim(), ignoreCase: true, out var parsed))
            {
                return Array.Empty<TemplateDto>();
            }
            channelFilter = parsed;
        }

        var templates = await templateRepository.ListAsync(channelFilter, cancellationToken);
        return TemplateMapper.ToDtos(templates);
    }

    public async Task<TemplateDto?> GetTemplateByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var template = await templateRepository.GetByIdAsync(id, cancellationToken);
        return template is null ? null : TemplateMapper.ToDto(template);
    }
}
