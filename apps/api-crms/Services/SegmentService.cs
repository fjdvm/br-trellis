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

        // Pre-load product stock data if any condition references in_stock
        Dictionary<Guid, bool>? contactInStockMap = null;
        if (rule.Conditions.Any(c =>
            c.Field.Equals("in_stock", StringComparison.OrdinalIgnoreCase)))
        {
            contactInStockMap = await BuildContactInStockMapAsync(cancellationToken);
        }

        return contacts.Where(c => EvaluateRule(c, rule, contactInStockMap)).ToList();
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

    private static bool EvaluateRule(
        Contact contact, SegmentRule rule, Dictionary<Guid, bool>? contactInStockMap)
    {
        if (rule.MatchMode == "MatchAll")
        {
            return rule.Conditions.All(condition =>
                EvaluateCondition(contact, condition, contactInStockMap));
        }

        return rule.Conditions.Any(condition =>
            EvaluateCondition(contact, condition, contactInStockMap));
    }

    private static bool EvaluateCondition(
        Contact contact, SegmentCondition condition, Dictionary<Guid, bool>? contactInStockMap)
    {
        // Special handling for in_stock condition
        if (condition.Field.Equals("in_stock", StringComparison.OrdinalIgnoreCase))
        {
            return EvaluateInStockCondition(contact, condition, contactInStockMap);
        }

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

    private static bool EvaluateInStockCondition(
        Contact contact, SegmentCondition condition, Dictionary<Guid, bool>? contactInStockMap)
    {
        if (contactInStockMap is null) return false;

        var hasInStock = contactInStockMap.TryGetValue(contact.Id, out var allInStock);
        var expectedValue = condition.Value.Equals("true", StringComparison.OrdinalIgnoreCase);

        return condition.Operator switch
        {
            "equals" => hasInStock && allInStock == expectedValue,
            "not_equals" => !hasInStock || allInStock != expectedValue,
            _ => false,
        };
    }

    /// <summary>
    /// Builds a map of ContactId → whether ALL related products (via cart/order items) are in stock.
    /// </summary>
    private async Task<Dictionary<Guid, bool>> BuildContactInStockMapAsync(
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<Guid, bool>();

        // Get product stock status
        var products = await dbContext.Products.AsNoTracking()
            .ToListAsync(cancellationToken);
        var productStockMap = products.ToDictionary(p => p.PlatformProductId, p => p.InStock);

        // Check cart items for each contact
        var carts = await dbContext.Carts.AsNoTracking()
            .Include(c => c.Items)
            .Where(c => c.ContactId != null)
            .ToListAsync(cancellationToken);

        foreach (var cart in carts)
        {
            if (cart.ContactId is null) continue;
            var contactId = cart.ContactId.Value;

            var allItemsInStock = cart.Items.All(item =>
                productStockMap.TryGetValue(item.ProductId, out var inStock) && inStock);

            // If contact already has a false, keep it false (any out-of-stock fails the check)
            if (result.TryGetValue(contactId, out var existing))
            {
                result[contactId] = existing && allItemsInStock;
            }
            else
            {
                result[contactId] = allItemsInStock;
            }
        }

        return result;
    }

    private static string? GetFieldValue(Contact contact, string field)
    {
        return field.ToLowerInvariant() switch
        {
            "name" => contact.Name,
            "email" => contact.Email,
            "phone" => contact.Phone,
            "sentimentscore" => contact.SentimentScore?.ToString(),
            "lifetimevalue" => contact.LifetimeValue.ToString(),
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
