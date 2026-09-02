namespace api_crms.DTOs;

public sealed record TemplateDto(
    Guid Id,
    string Name,
    string? Description,
    string Channel,
    string Content,
    string Format,
    string? ThumbnailUrl,
    DateTimeOffset CreatedAt);
