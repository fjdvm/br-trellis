namespace api_crms.DTOs;

public sealed record SegmentDto(
    Guid Id,
    string Name,
    string Type,
    bool IsSystemDefined,
    string? Rule,
    int MemberCount);

public sealed record SegmentConditionDto(
    string Field,
    string Operator,
    string Value);

public sealed record SegmentRuleDto(
    string MatchMode,
    IReadOnlyList<SegmentConditionDto> Conditions);
