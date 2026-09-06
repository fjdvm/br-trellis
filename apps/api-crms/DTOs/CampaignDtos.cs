namespace api_crms.DTOs;

public sealed record CampaignScheduleDto(
    string ScheduleType,
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    DateTimeOffset? NextRunAt);

public sealed record CampaignChannelContentDto(
    string Channel,
    Guid? TemplateId,
    string? Subject,
    string? Heading,
    string? Body,
    string? ImageUrl,
    string? LinkUrl,
    string? CtaText,
    string? CtaUrl,
    bool Dismissible);

public sealed record CampaignListItemDto(
    Guid Id,
    string Title,
    IReadOnlyList<string> Channels,
    string Status,
    string? TargetAudience,
    IReadOnlyList<string>? TargetEmails,
    DateTimeOffset CreatedAt,
    CampaignScheduleDto? Schedule);

public sealed record CampaignDetailDto(
    Guid Id,
    string Title,
    IReadOnlyList<string> Channels,
    string Status,
    string? TargetAudience,
    IReadOnlyList<string>? TargetEmails,
    DateTimeOffset CreatedAt,
    CampaignScheduleDto? Schedule,
    IReadOnlyList<CampaignChannelContentDto> ChannelContents,
    string? CreatedById,
    CampaignDispatchResultDto? DispatchResult);

// Input records. The wizard sends per-Channel content under ChannelContents.
public sealed record CampaignChannelContentInput(
    string Channel,
    Guid? TemplateId,
    string? Subject,
    string? Heading,
    string? Body,
    string? ImageUrl,
    string? LinkUrl,
    string? CtaText,
    string? CtaUrl,
    bool Dismissible = false);

public sealed record CreateCampaignDto(
    string Title,
    IReadOnlyList<string> Channels,
    string? TargetAudience,
    IReadOnlyList<string>? TargetEmails,
    string? ScheduleType,
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    IReadOnlyList<CampaignChannelContentInput>? ChannelContents);

public sealed record UpdateCampaignDto(
    string? Title,
    IReadOnlyList<string>? Channels,
    string? TargetAudience,
    IReadOnlyList<string>? TargetEmails,
    string? ScheduleType,
    DateTimeOffset? StartDate,
    DateTimeOffset? EndDate,
    IReadOnlyList<CampaignChannelContentInput>? ChannelContents);

// --- Cross-service dispatch contract (api-oos polls + reports back, #162) ---

// A Campaign that is due to send now, with its resolved (deduped, opt-out-filtered)
// recipient list and Email content already prepared by api-crms.
public sealed record DueCampaignDto(
    Guid Id,
    string Title,
    string Subject,
    string Body,
    IReadOnlyList<string> Recipients,
    string? Theme = null);

// The outcome api-oos reports back after a bulk send.
public sealed record CampaignDispatchResultDto(
    int TotalRecipients,
    int SentCount,
    int FailedCount,
    IReadOnlyList<string> Errors);

public sealed record MarketingOptOutDto(string Email);

// The composer's live preview asks the real dispatch renderer for HTML instead of
// reimplementing EmailBodyRenderer client-side, so the preview can never silently
// diverge from what actually gets sent/displayed.
public sealed record RenderPreviewRequestDto(string? Content, string? Theme = null);

public sealed record RenderPreviewResponseDto(string Html);

// The currently-Active Banner/Popup content served to the storefront (#163).
// Null is represented by a 204/absent response, not this record.
public sealed record ActiveChannelContentDto(
    Guid CampaignId,
    string Channel,
    string? Heading,
    string? Body,
    string? ImageUrl,
    string? LinkUrl,
    string? CtaText,
    string? CtaUrl,
    bool Dismissible);

// --- Analytics (#164) ---

// An open/click event relayed from Brevo via api-oos, attributed to a Campaign.
public sealed record CampaignEventDto(
    string EventType,
    string Email,
    string? Url,
    DateTimeOffset? OccurredAt);

// Lightweight per-Campaign engagement summary (Campaigns list).
public sealed record CampaignEngagementMetricsDto(
    Guid CampaignId,
    int SentCount,
    int OpenedCount,
    int ClickedCount,
    double OpenRate,
    double ClickRate);

public sealed record EngagementByDayDto(string Date, int Opens, int Clicks);

public sealed record LinkPerformanceDto(
    string DestinationUrl,
    int TotalClicks,
    int UniqueClicks,
    double ShareOfTotalClicks);

// Full analytics for a single Campaign (CampaignDetail).
public sealed record CampaignAnalyticsDto(
    int SentCount,
    int OpenedCount,
    int ClickedCount,
    double OpenRate,
    double ClickRate,
    IReadOnlyList<EngagementByDayDto> EngagementByDay,
    IReadOnlyList<LinkPerformanceDto> LinkPerformance);
