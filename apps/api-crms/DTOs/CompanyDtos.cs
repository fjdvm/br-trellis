namespace api_crms.DTOs;

public sealed record CompanyListItemDto(
    Guid Id,
    string Name,
    string BuyerType,
    int MemberCount,
    DateTimeOffset CreatedAt);

public sealed record CompanyContactDto(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone,
    decimal LifetimeValue);

public sealed record CompanyDetailDto(
    Guid Id,
    string Name,
    string BuyerType,
    Guid? PrimaryContactId,
    CompanyContactDto? PrimaryContact,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DeletedAt,
    IReadOnlyList<CompanyContactDto> Contacts);

public sealed record CreateCompanyDto(
    string Name,
    string BuyerType,
    Guid? PrimaryContactId);

public sealed record UpdateCompanyDto(
    string? Name,
    string? BuyerType,
    Guid? PrimaryContactId);
