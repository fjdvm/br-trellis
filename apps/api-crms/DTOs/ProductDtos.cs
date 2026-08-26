namespace api_crms.DTOs;

public sealed record ProductListItemDto(
    Guid Id,
    string PlatformProductId,
    string Name,
    decimal Price,
    bool InStock,
    DateTimeOffset UpdatedAt);
