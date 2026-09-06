using api_crms.Enums;

namespace api_crms.Models;

// A pre-defined, dev/business-curated content template a Campaign Channel can be
// based on. Not user-authorable this round: the set is seeded and fixed, exposed
// read-only via list/get-by-id.
public sealed class Template
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    // The Channel this template is designed for (Email, Banner, or Popup).
    public CampaignChannel Channel { get; set; }

    // The raw template content. Interpreted according to Format.
    public string Content { get; set; } = string.Empty;

    // How Content should be interpreted. "Html" today; "Blocks" reserved.
    public TemplateFormat Format { get; set; }

    public string? ThumbnailUrl { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
