using api_crms.Enums;

namespace api_crms.Models;

// The sole persisted marketing entity. "Active Campaigns" and "Published Posts"
// are the same list filtered by Status. A Campaign targets one or more Channels,
// each with its own content (ChannelContents). Email Campaigns additionally have
// an audience (a Segment reference plus optional explicit emails), snapshotted at
// Launch. Banner/Popup Campaigns are untargeted, site-wide.
public sealed class Campaign
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public CampaignStatus Status { get; set; }

    // The Channels this Campaign targets, persisted as a comma-separated list of
    // CampaignChannel names (e.g. "Email,Banner"). Stored denormalized alongside
    // the ChannelContents rows for cheap list-view reads.
    public string Channels { get; set; } = string.Empty;

    // --- Audience (Email only) ---
    // The chosen Segment, referenced by id or preset key. Banner/Popup leave this null.
    public Guid? TargetSegmentId { get; set; }
    public string? TargetSegmentPreset { get; set; }

    // Free-text explicit email addresses (JSON array), merged with the Segment at
    // Launch. Null/empty when none.
    public string? TargetEmails { get; set; }

    // Recipient list snapshotted at Launch (JSON array of normalized emails).
    // Null until the Campaign is launched (#161).
    public string? ResolvedRecipients { get; set; }

    // --- Schedule ---
    public ScheduleType ScheduleType { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }

    // When the dispatch/activation sweep should next act on this Campaign.
    public DateTimeOffset? NextRunAt { get; set; }

    // Whether the Email channel has reached a terminal (sent-or-failed) state.
    // Feeds the cross-Channel status aggregation (#161/#162).
    public bool EmailTerminal { get; set; }

    // Email dispatch outcome, recorded by api-oos after a bulk send (#162).
    public int? DispatchSentCount { get; set; }
    public int? DispatchFailedCount { get; set; }
    // JSON array of per-recipient error strings.
    public string? DispatchErrors { get; set; }
    public DateTimeOffset? DispatchedAt { get; set; }

    public string? CreatedById { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<CampaignChannelContent> ChannelContents { get; } =
        new List<CampaignChannelContent>();
}
