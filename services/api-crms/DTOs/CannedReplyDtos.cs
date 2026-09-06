namespace api_crms.DTOs;

public sealed record CannedReplyListItemDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Body,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DeletedAt);

public sealed record CannedReplyDetailDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Name,
    string Body,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DeletedAt);

public sealed record CreateCannedReplyDto(
    Guid CategoryId,
    string Name,
    string Body);

public sealed record UpdateCannedReplyDto(
    Guid? CategoryId,
    string? Name,
    string? Body);
