using System.Text.Json;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;

namespace api_crms.Mappers;

public static class CampaignMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static IReadOnlyList<string> ParseChannels(string channels)
    {
        if (string.IsNullOrWhiteSpace(channels))
        {
            return Array.Empty<string>();
        }
        return channels
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
    }

    public static IReadOnlyList<string>? ParseEmails(string? emailsJson)
    {
        if (string.IsNullOrWhiteSpace(emailsJson))
        {
            return null;
        }
        return JsonSerializer.Deserialize<List<string>>(emailsJson, JsonOptions);
    }

    public static CampaignScheduleDto ToScheduleDto(Campaign campaign)
    {
        return new CampaignScheduleDto(
            campaign.ScheduleType.ToString(),
            campaign.StartDate,
            campaign.EndDate,
            campaign.NextRunAt);
    }

    public static CampaignChannelContentDto ToContentDto(CampaignChannelContent content)
    {
        return new CampaignChannelContentDto(
            content.Channel.ToString(),
            content.TemplateId,
            content.Subject,
            content.Heading,
            content.Body,
            content.ImageUrl,
            content.LinkUrl,
            content.CtaText,
            content.CtaUrl,
            content.Dismissible);
    }

    public static CampaignListItemDto ToListItem(Campaign campaign)
    {
        return new CampaignListItemDto(
            campaign.Id,
            campaign.Title,
            ParseChannels(campaign.Channels),
            campaign.Status.ToString(),
            campaign.TargetSegmentId?.ToString() ?? campaign.TargetSegmentPreset,
            ParseEmails(campaign.TargetEmails),
            campaign.CreatedAt,
            ToScheduleDto(campaign));
    }

    public static IReadOnlyList<CampaignListItemDto> ToListItems(IEnumerable<Campaign> campaigns)
    {
        return campaigns.Select(ToListItem).ToList();
    }

    public static CampaignDetailDto ToDetail(Campaign campaign)
    {
        CampaignDispatchResultDto? dispatch = campaign.DispatchedAt.HasValue
            ? new CampaignDispatchResultDto(
                (campaign.DispatchSentCount ?? 0) + (campaign.DispatchFailedCount ?? 0),
                campaign.DispatchSentCount ?? 0,
                campaign.DispatchFailedCount ?? 0,
                ParseErrors(campaign.DispatchErrors))
            : null;

        return new CampaignDetailDto(
            campaign.Id,
            campaign.Title,
            ParseChannels(campaign.Channels),
            campaign.Status.ToString(),
            campaign.TargetSegmentId?.ToString() ?? campaign.TargetSegmentPreset,
            ParseEmails(campaign.TargetEmails),
            campaign.CreatedAt,
            ToScheduleDto(campaign),
            campaign.ChannelContents
                .OrderBy(c => c.Channel)
                .Select(ToContentDto)
                .ToList(),
            campaign.CreatedById,
            dispatch);
    }

    private static IReadOnlyList<string> ParseErrors(string? errorsJson)
    {
        if (string.IsNullOrWhiteSpace(errorsJson))
        {
            return Array.Empty<string>();
        }
        return JsonSerializer.Deserialize<List<string>>(errorsJson, JsonOptions) ?? new List<string>();
    }

    public static string SerializeEmails(IReadOnlyList<string>? emails)
    {
        var cleaned = (emails ?? Array.Empty<string>())
            .Select(e => e.Trim().ToLowerInvariant())
            .Where(e => e.Length > 0)
            .Distinct()
            .ToList();
        return cleaned.Count == 0 ? string.Empty : JsonSerializer.Serialize(cleaned);
    }
}
