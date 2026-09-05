namespace api_crms.DTOs;

public sealed record TemplateBlockDto(
    Guid Id,
    string Type,
    string Label,
    int Order,
    string? TextAlign,
    bool IsBold,
    bool IsItalic,
    string? Content);

public sealed record CreateTemplateBlockInput(
    string Type,
    string Label,
    int Order,
    string? TextAlign,
    bool? IsBold,
    bool? IsItalic,
    string? Content = null);

public sealed record BlockTemplateDto(
    Guid Id,
    string Name,
    string? Description,
    string Channel,
    bool IsArchived,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<TemplateBlockDto> Blocks);

public sealed record CreateBlockTemplateInput(
    string Name,
    string? Description,
    string Channel,
    IReadOnlyList<CreateTemplateBlockInput> Blocks);

public sealed record UpdateBlockTemplateInput(
    string Name,
    string? Description,
    string Channel,
    IReadOnlyList<CreateTemplateBlockInput> Blocks);
