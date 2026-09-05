using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using api_crms.Models;

namespace api_crms.Helpers;

/// <summary>
/// Converts a BlockTemplate's Blocks into the JSON-array shape EmailBodyRenderer
/// already renders to HTML ([{type,label,order,textAlign,isBold,isItalic,content}]),
/// so a Campaign that references a Template renders the same real content the
/// Template Builder saved, rather than an empty structural skeleton.
/// </summary>
public static class BlockTemplateContentRenderer
{
    /// <param name="contentOverridesJson">
    /// The Channel content's own Body, when it holds a per-Campaign content
    /// override dictionary keyed by block id (the shape the composer's
    /// per-campaign block content fields save). A block's own Content is used
    /// whenever no override is present for it, so a Template can be referenced
    /// as-is with no per-Campaign customization at all.
    /// </param>
    public static string ToBlocksJson(BlockTemplate template, string? contentOverridesJson = null)
    {
        var overrides = ParseOverrides(contentOverridesJson);

        var array = new JsonArray();
        foreach (var block in template.Blocks.OrderBy(b => b.Order))
        {
            JsonNode? overrideNode = null;
            var hasOverride = overrides is not null
                && overrides.TryGetPropertyValue(block.Id.ToString(), out overrideNode)
                && IsMeaningful(overrideNode);
            var content = hasOverride ? overrideNode?.DeepClone() : ParseContent(block.Content);

            var node = new JsonObject
            {
                ["type"] = block.Type,
                ["label"] = block.Label,
                ["order"] = block.Order,
                ["textAlign"] = block.TextAlign,
                ["isBold"] = block.IsBold,
                ["isItalic"] = block.IsItalic,
                ["content"] = content,
            };
            array.Add(node);
        }
        return array.ToJsonString();
    }

    private static JsonObject? ParseOverrides(string? contentOverridesJson)
    {
        if (string.IsNullOrWhiteSpace(contentOverridesJson))
        {
            return null;
        }

        var trimmed = contentOverridesJson.Trim();
        if (!trimmed.StartsWith("{"))
        {
            return null;
        }

        try
        {
            return JsonNode.Parse(trimmed) as JsonObject;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    // A per-Campaign override only counts once it actually has content — the
    // composer initializes every block to an empty value the moment a Template is
    // selected, and an empty override must not blank out the Template's own
    // default content just because the user hasn't touched that field yet.
    private static bool IsMeaningful(JsonNode? node)
    {
        switch (node)
        {
            case null:
                return false;
            case JsonValue value when value.TryGetValue<string>(out var s):
                return !string.IsNullOrWhiteSpace(s);
            case JsonObject obj:
                return obj.Any(kv => kv.Value is JsonValue v && v.TryGetValue<string>(out var s) && !string.IsNullOrWhiteSpace(s));
            case JsonArray arr:
                return arr.Any(item => item is JsonObject slide
                    && slide.TryGetPropertyValue("imageUrl", out var img)
                    && img is JsonValue iv && iv.TryGetValue<string>(out var s) && !string.IsNullOrWhiteSpace(s));
            default:
                return true;
        }
    }

    private static JsonNode? ParseContent(string? content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        var trimmed = content.Trim();
        if (trimmed.StartsWith("{") || trimmed.StartsWith("["))
        {
            try
            {
                return JsonNode.Parse(trimmed);
            }
            catch (JsonException)
            {
                // Not actually JSON despite the leading brace; treat as plain text.
            }
        }

        return JsonValue.Create(content);
    }
}
