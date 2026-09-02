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
    IReadOnlyList<string> Recipients);

// The outcome api-oos reports back after a bulk send.
public sealed record CampaignDispatchResultDto(
    int TotalRecipients,
    int SentCount,
    int FailedCount,
    IReadOnlyList<string> Errors);

public sealed record MarketingOptOutDto(string Email);

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
