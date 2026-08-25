using System.Text.Json;
using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed class SegmentService(
    ISegmentRepository segmentRepository,
    AppDbContext dbContext) : ISegmentService
{
    public async Task<IReadOnlyList<Contact>> EvaluateSegmentAsync(
        Guid segmentId,
        CancellationToken cancellationToken)
    {
        var segment = await segmentRepository.GetByIdAsync(segmentId, cancellationToken)
            ?? throw new InvalidOperationException("Segment not found.");

        if (segment.Type == SegmentType.Static)
        {
            return await segmentRepository.GetStaticMembersAsync(segmentId, cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(segment.Rule))
        {
            return [];
        }

        var rule = JsonSerializer.Deserialize<SegmentRule>(segment.Rule, JsonOptions);
        if (rule is null || rule.Conditions.Count == 0)
        {
            return [];
        }

        var contacts = await dbContext.Contacts.AsNoTracking()
            .Where(c => c.DeletedAt == null)
            .Include(c => c.CustomFieldValues)
                .ThenInclude(v => v.Definition)
            .ToListAsync(cancellationToken);

        return contacts.Where(c => EvaluateRule(c, rule)).ToList();
    }

    public Task<IReadOnlyList<Contact>> GetStaticMembersAsync(
        Guid segmentId,
        CancellationToken cancellationToken)
    {
        return segmentRepository.GetStaticMembersAsync(segmentId, cancellationToken);
    }

    public async Task DeleteSegmentAsync(Guid segmentId, CancellationToken cancellationToken)
    {
        var segment = await segmentRepository.GetByIdAsync(segmentId, cancellationToken)
            ?? throw new InvalidOperationException("Segment not found.");

        if (segment.IsSystemDefined)
        {
            throw new InvalidOperationException("Cannot delete a system-defined segment.");
        }

        await segmentRepository.DeleteAsync(segment, cancellationToken);
    }

    private static bool EvaluateRule(Contact contact, SegmentRule rule)
    {
        if (rule.MatchMode == "MatchAll")
        {
            return rule.Conditions.All(condition => EvaluateCondition(contact, condition));
        }

        return rule.Conditions.Any(condition => EvaluateCondition(contact, condition));
    }

    private static bool EvaluateCondition(Contact contact, SegmentCondition condition)
    {
        var fieldValue = GetFieldValue(contact, condition.Field);
        return condition.Operator switch
        {
            "equals" => string.Equals(fieldValue, condition.Value, StringComparison.OrdinalIgnoreCase),
            "not_equals" => !string.Equals(fieldValue, condition.Value, StringComparison.OrdinalIgnoreCase),
            "contains" => fieldValue?.Contains(condition.Value, StringComparison.OrdinalIgnoreCase) == true,
            "less_than" => CompareNumeric(fieldValue, condition.Value) < 0,
            "greater_than" => CompareNumeric(fieldValue, condition.Value) > 0,
            "less_than_or_equal" => CompareNumeric(fieldValue, condition.Value) <= 0,
            "greater_than_or_equal" => CompareNumeric(fieldValue, condition.Value) >= 0,
            _ => false,
        };
    }

    private static string? GetFieldValue(Contact contact, string field)
    {
        return field.ToLowerInvariant() switch
        {
            "name" => contact.Name,
            "email" => contact.Email,
            "phone" => contact.Phone,
            "sentimentscore" => contact.SentimentScore?.ToString(),
            _ => GetCustomFieldValue(contact, field),
        };
    }

    private static string? GetCustomFieldValue(Contact contact, string field)
    {
        var cfv = contact.CustomFieldValues
            .FirstOrDefault(v => string.Equals(v.Definition?.Name, field, StringComparison.OrdinalIgnoreCase));

        if (cfv is null) return null;

        return cfv.TextValue
            ?? cfv.NumberValue?.ToString()
            ?? cfv.DateValue?.ToString("O")
            ?? cfv.BoolValue?.ToString()
            ?? cfv.OptionId?.ToString();
    }

    private static int CompareNumeric(string? left, string right)
    {
        if (decimal.TryParse(left, out var leftNum) && decimal.TryParse(right, out var rightNum))
        {
            return leftNum.CompareTo(rightNum);
        }

        return string.Compare(left, right, StringComparison.OrdinalIgnoreCase);
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed record SegmentRule(string MatchMode, IReadOnlyList<SegmentCondition> Conditions);

    private sealed record SegmentCondition(string Field, string Operator, string Value);
}
