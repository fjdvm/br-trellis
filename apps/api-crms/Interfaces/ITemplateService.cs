using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ITemplateService
{
    // Lists seeded templates, optionally filtered by channel. An unrecognized
    // channel string yields an empty list rather than an error.
    Task<IReadOnlyList<TemplateDto>> ListTemplatesAsync(string? channel, CancellationToken cancellationToken);

    Task<TemplateDto?> GetTemplateByIdAsync(Guid id, CancellationToken cancellationToken);
}
