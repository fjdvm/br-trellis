namespace api_crms.DTOs;

public sealed record SegmentDto(
    Guid Id,
    string Name,
    string Type,
    bool IsSystemDefined,
    SegmentRuleDto? Rule,
    int MemberCount);

public sealed record SegmentConditionDto(
    string Field,
    string Operator,
    string Value);

public sealed record SegmentRuleDto(
    string MatchMode,
    IReadOnlyList<SegmentConditionDto> Conditions);

public sealed record SegmentMemberDto(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone,
    string? CompanyName,
    decimal LifetimeValue);

/// <summary>
/// Real-time counts for the four system preset segments shown in the campaign audience step.
/// </summary>
public sealed record AudienceCountsDto(
    int All,
    int Contacts,
    int Companies,
    int Ecommerce);

