using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed partial class CampaignService(
    ICampaignRepository campaignRepository,
    ISegmentService segmentService,
    AppDbContext dbContext,
    IMarketingEmailSender marketingEmailSender,
    CampaignDispatchOptions dispatchOptions) : ICampaignService
{
    public async Task<IReadOnlyList<CampaignListItemDto>> ListCampaignsAsync(
        string? status,
        CancellationToken cancellationToken)
    {
        CampaignStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            if (!Enum.TryParse<CampaignStatus>(status.Trim(), ignoreCase: true, out var parsed))
            {
                return Array.Empty<CampaignListItemDto>();
            }
            statusFilter = parsed;
        }

        var campaigns = await campaignRepository.ListAsync(statusFilter, cancellationToken);
        return CampaignMapper.ToListItems(campaigns);
    }

    public async Task<CampaignDetailDto?> GetCampaignByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdAsync(id, cancellationToken);
        return campaign is null ? null : CampaignMapper.ToDetail(campaign);
    }

    public async Task<CampaignDetailDto> CreateCampaignAsync(
        CreateCampaignDto input,
        string? createdById,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Title))
        {
            throw new ArgumentException("Campaign title is required.");
        }

        var channels = ParseAndValidateChannels(input.Channels);
        var now = DateTimeOffset.UtcNow;

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Title = input.Title.Trim(),
            Status = CampaignStatus.Draft,
            Channels = string.Join(",", channels.Select(c => c.ToString())),
            TargetSegmentId = ParseSegmentId(input.TargetAudience),
            TargetSegmentPreset = ParseSegmentPreset(input.TargetAudience),
            TargetEmails = CampaignMapper.SerializeEmails(input.TargetEmails) is { Length: > 0 } e ? e : null,
            ScheduleType = ParseScheduleType(input.ScheduleType),
            StartDate = input.StartDate,
            EndDate = input.EndDate,
            CreatedById = createdById,
            CreatedAt = now,
            UpdatedAt = now,
        };

        foreach (var content in BuildChannelContents(campaign.Id, channels, input.ChannelContents))
        {
            campaign.ChannelContents.Add(content);
        }

        dbContext.Campaigns.Add(campaign);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CampaignMapper.ToDetail(campaign);
    }

    public async Task<CampaignDetailDto?> UpdateCampaignAsync(
        Guid id,
        UpdateCampaignDto input,
        CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.ChannelContents)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        // Only Drafts are editable — once launched, a Campaign's content and
        // audience are locked (see #161 audience snapshotting).
        if (campaign.Status != CampaignStatus.Draft)
        {
            throw new InvalidOperationException("Only Draft campaigns can be edited.");
        }

        if (!string.IsNullOrWhiteSpace(input.Title))
        {
            campaign.Title = input.Title.Trim();
        }

        var channels = campaign.Channels;
        List<CampaignChannel>? parsedChannels = null;
        if (input.Channels is not null)
        {
            parsedChannels = ParseAndValidateChannels(input.Channels);
            campaign.Channels = string.Join(",", parsedChannels.Select(c => c.ToString()));
        }

        if (input.TargetAudience is not null)
        {
            campaign.TargetSegmentId = ParseSegmentId(input.TargetAudience);
            campaign.TargetSegmentPreset = ParseSegmentPreset(input.TargetAudience);
        }

        if (input.TargetEmails is not null)
        {
            var serialized = CampaignMapper.SerializeEmails(input.TargetEmails);
            campaign.TargetEmails = serialized.Length > 0 ? serialized : null;
        }

        if (!string.IsNullOrWhiteSpace(input.ScheduleType))
        {
            campaign.ScheduleType = ParseScheduleType(input.ScheduleType);
        }

        if (input.StartDate.HasValue)
        {
            campaign.StartDate = input.StartDate;
        }
        if (input.EndDate.HasValue)
        {
            campaign.EndDate = input.EndDate;
        }

        // Replacing content wholesale keeps the "channelContents keyed per channel"
        // shape authoritative: whatever the wizard submits is the new truth.
        if (input.ChannelContents is not null)
        {
            var existing = campaign.ChannelContents.ToList();
            dbContext.CampaignChannelContents.RemoveRange(existing);
            var channelSet = parsedChannels ?? CampaignMapper.ParseChannels(channels)
                .Select(c => Enum.Parse<CampaignChannel>(c))
                .ToList();
            var fresh = BuildChannelContents(campaign.Id, channelSet, input.ChannelContents);
            dbContext.CampaignChannelContents.AddRange(fresh);
            // Reflect the replacement in the in-memory graph so the returned DTO
            // is accurate without a re-query.
            campaign.ChannelContents.Clear();
            foreach (var c in fresh)
            {
                campaign.ChannelContents.Add(c);
            }
        }

        campaign.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return CampaignMapper.ToDetail(campaign);
    }

    public async Task<bool> DeleteCampaignAsync(Guid id, CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.ChannelContents)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (campaign is null)
        {
            return false;
        }

        dbContext.CampaignChannelContents.RemoveRange(campaign.ChannelContents);
        dbContext.Campaigns.Remove(campaign);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }


    // --- helpers ---

    private static List<CampaignChannel> ParseAndValidateChannels(IReadOnlyList<string>? channels)
    {
        if (channels is null || channels.Count == 0)
        {
            throw new ArgumentException("At least one channel is required.");
        }

        var parsed = new List<CampaignChannel>();
        foreach (var c in channels)
        {
            if (!Enum.TryParse<CampaignChannel>(c?.Trim(), ignoreCase: true, out var channel))
            {
                throw new ArgumentException($"Unknown channel '{c}'.");
            }
            if (!parsed.Contains(channel))
            {
                parsed.Add(channel);
            }
        }
        return parsed;
    }

    private static ScheduleType ParseScheduleType(string? scheduleType)
    {
        if (string.IsNullOrWhiteSpace(scheduleType))
        {
            return ScheduleType.SendNow;
        }
        return Enum.TryParse<ScheduleType>(scheduleType.Trim(), ignoreCase: true, out var parsed)
            ? parsed
            : ScheduleType.SendNow;
    }

    private static Guid? ParseSegmentId(string? targetAudience)
    {
        if (string.IsNullOrWhiteSpace(targetAudience))
        {
            return null;
        }
        return Guid.TryParse(targetAudience.Trim(), out var id) ? id : null;
    }

    private static string? ParseSegmentPreset(string? targetAudience)
    {
        if (string.IsNullOrWhiteSpace(targetAudience))
        {
            return null;
        }
        var trimmed = targetAudience.Trim();
        if (trimmed == "__none__")
        {
            return null;
        }
        return Guid.TryParse(trimmed, out _) ? null : trimmed;
    }

    private static List<CampaignChannelContent> BuildChannelContents(
        Guid campaignId,
        IReadOnlyList<CampaignChannel> channels,
        IReadOnlyList<CampaignChannelContentInput>? contents)
    {
        var result = new List<CampaignChannelContent>();
        if (contents is null)
        {
            return result;
        }

        foreach (var input in contents)
        {
            if (!Enum.TryParse<CampaignChannel>(input.Channel?.Trim(), ignoreCase: true, out var channel))
            {
                continue;
            }
            // Ignore content for a Channel the Campaign doesn't actually target.
            if (!channels.Contains(channel))
            {
                continue;
            }

            result.Add(new CampaignChannelContent
            {
                Id = Guid.NewGuid(),
                CampaignId = campaignId,
                Channel = channel,
                TemplateId = input.TemplateId,
                Subject = input.Subject?.Trim(),
                Heading = input.Heading?.Trim(),
                Body = input.Body?.Trim(),
                ImageUrl = input.ImageUrl?.Trim(),
                LinkUrl = input.LinkUrl?.Trim(),
                CtaText = input.CtaText?.Trim(),
                CtaUrl = input.CtaUrl?.Trim(),
                Dismissible = input.Dismissible,
            });
        }
        return result;
    }
}
