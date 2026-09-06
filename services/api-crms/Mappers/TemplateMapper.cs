using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class TemplateMapper
{
    public static TemplateDto ToDto(Template template)
    {
        return new TemplateDto(
            template.Id,
            template.Name,
            template.Description,
            template.Channel.ToString(),
            template.Content,
            template.Format.ToString(),
            template.ThumbnailUrl,
            template.CreatedAt);
    }

    public static IReadOnlyList<TemplateDto> ToDtos(IEnumerable<Template> templates)
    {
        return templates.Select(ToDto).ToList();
    }
}
