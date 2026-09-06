using api_crms.Enums;

namespace api_crms.Models;

// Per-Channel content for a Campaign. A Campaign has at most one row per Channel,
// so a Banner and a Popup on the same Campaign never share content. The fields
// used depend on the Channel:
//   Email:  Subject, Body (Description), TemplateId, ImageUrl
//   Banner: Body (message), TemplateId, LinkUrl, Dismissible
//   Popup:  Heading, Body (message), TemplateId, ImageUrl, CtaText, CtaUrl
public sealed class CampaignChannelContent
{
    public Guid Id { get; set; }

    public Guid CampaignId { get; set; }

    public Campaign? Campaign { get; set; }

    public CampaignChannel Channel { get; set; }

    public Guid? TemplateId { get; set; }

    // Email subject line (Email only).
    public string? Subject { get; set; }

    // Popup heading (Popup only).
    public string? Heading { get; set; }

    // Main message/body text (all channels).
    public string? Body { get; set; }

    public string? ImageUrl { get; set; }

    // Banner/Popup destination link.
    public string? LinkUrl { get; set; }

    // Popup CTA button.
    public string? CtaText { get; set; }
    public string? CtaUrl { get; set; }

    // Banner: whether a visitor can dismiss it.
    public bool Dismissible { get; set; }
}
