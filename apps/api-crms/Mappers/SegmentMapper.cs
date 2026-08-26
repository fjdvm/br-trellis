using System.Text.Json;
using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class SegmentMapper
{
    public static SegmentDto ToDto(Segment segment, int memberCount)
    {
        var rule = ParseRuleDto(segment.Rule);
        return new SegmentDto(
            segment.Id,
            segment.Name,
            segment.Type.ToString(),
            segment.IsSystemDefined,
            rule,
            memberCount);
    }

    public static IReadOnlyList<SegmentMemberDto> ToMemberDtos(IEnumerable<Contact> contacts)
    {
        return contacts.Select(c => new SegmentMemberDto(
            c.Id,
            c.Name,
            c.Email,
            c.Phone,
            c.Company?.Name,
            c.LifetimeValue)).ToList();
    }

    public static SegmentRuleDto? ParseRuleDto(string? ruleJson)
    {
        if (string.IsNullOrWhiteSpace(ruleJson))
        {
            return null;
        }

        var rule = JsonSerializer.Deserialize<RuleShape>(ruleJson, JsonOptions);
        if (rule is null || rule.Conditions.Count == 0)
        {
            return null;
        }

        return new SegmentRuleDto(
            rule.MatchMode,
            rule.Conditions.Select(c => new SegmentConditionDto(c.Field, c.Operator, c.Value)).ToList());
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed record RuleShape(string MatchMode, IReadOnlyList<ConditionShape> Conditions);
    private sealed record ConditionShape(string Field, string Operator, string Value);
}
