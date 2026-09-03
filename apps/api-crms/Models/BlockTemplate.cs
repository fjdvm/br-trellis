using api_crms.Enums;

namespace api_crms.Models;

public sealed class BlockTemplate
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public CampaignChannel Channel { get; set; }

    public bool IsArchived { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public List<TemplateBlock> Blocks { get; set; } = [];
}

public sealed class TemplateBlock
{
    public Guid Id { get; set; }

    public Guid BlockTemplateId { get; set; }

    public BlockTemplate? BlockTemplate { get; set; }

    // Block type: heading, text, image, link, button, carousel
    public string Type { get; set; } = string.Empty;

    // Structural Label (e.g. "Main headline", "Hero image") - NO actual text content!
    public string Label { get; set; } = string.Empty;

    // Order within the template layout (0-indexed)
    public int Order { get; set; }

    // Structural styling options only (alignment, bold, italic)
    public string? TextAlign { get; set; }
    public bool IsBold { get; set; }
    public bool IsItalic { get; set; }
}
