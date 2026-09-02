using api_crms.Enums;

namespace api_crms.Models;

// A single open/click engagement event for an Email Campaign, relayed from Brevo
// via api-oos and attributed to the originating Campaign + recipient. Aggregated
// into open/click rates and engagement-by-day/link-performance analytics (#164).
public sealed class CampaignEvent
{
    public Guid Id { get; set; }

    public Guid CampaignId { get; set; }

    public Campaign? Campaign { get; set; }

    public CampaignEventType EventType { get; set; }

    // The recipient the event is attributed to (normalized email).
    public string Email { get; set; } = string.Empty;

    // The clicked link (Click events only).
    public string? Url { get; set; }

    public DateTimeOffset OccurredAt { get; set; }
}
