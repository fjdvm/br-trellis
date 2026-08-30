namespace api_crms.DTOs;

public sealed record CannedReplyCategoryListItemDto(
    Guid Id,
    string Name,
    int ReplyCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DeletedAt);

public sealed record CannedReplyCategoryDetailDto(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DeletedAt,
    int ReplyCount);

public sealed record CreateCannedReplyCategoryDto(
    string Name);

public sealed record UpdateCannedReplyCategoryDto(
    string? Name);
