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
    string? CreatedById);

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
