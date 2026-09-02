using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed class CampaignService(
    ICampaignRepository campaignRepository,
    ISegmentService segmentService,
    AppDbContext dbContext) : ICampaignService
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

    public async Task<CampaignDetailDto?> LaunchCampaignAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.ChannelContents)
            .SingleOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        if (campaign.Status != CampaignStatus.Draft)
        {
            throw new InvalidOperationException("Only Draft campaigns can be launched.");
        }

        var channels = CampaignMapper.ParseChannels(campaign.Channels)
            .Select(c => Enum.Parse<CampaignChannel>(c))
            .ToList();

        // Single-active-per-Channel for Banner/Popup: reject if an already-Active
        // campaign of the same Channel has an overlapping active window. Email has
        // no such constraint (no physical storefront slot).
        foreach (var channel in channels.Where(c => c is CampaignChannel.Banner or CampaignChannel.Popup))
        {
            await EnsureNoActiveOverlapAsync(campaign, channel, cancellationToken);
        }

        // Snapshot the Email audience (Segment members + explicit emails) as-is at
        // this moment. Dedup / opt-out filtering is applied at dispatch time (#162).
        if (channels.Contains(CampaignChannel.Email))
        {
            campaign.ResolvedRecipients = await ResolveEmailAudienceAsync(campaign, cancellationToken);
        }

        campaign.Status = CampaignStatus.Active;
        var now = DateTimeOffset.UtcNow;
        // SendNow is due immediately; Scheduled is due at StartDate.
        campaign.NextRunAt = campaign.ScheduleType == ScheduleType.Scheduled && campaign.StartDate.HasValue
            ? campaign.StartDate
            : now;
        campaign.UpdatedAt = now;

        await dbContext.SaveChangesAsync(cancellationToken);
        return CampaignMapper.ToDetail(campaign);
    }

    public async Task<IReadOnlyList<Guid>> SweepCampaignLifecycleAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var active = await dbContext.Campaigns
            .Include(c => c.ChannelContents)
            .Where(c => c.Status == CampaignStatus.Active)
            .ToListAsync(cancellationToken);

        var ended = new List<Guid>();
        foreach (var campaign in active)
        {
            if (AllChannelsTerminal(campaign, now))
            {
                campaign.Status = CampaignStatus.Ended;
                campaign.UpdatedAt = now;
                ended.Add(campaign.Id);
            }
        }

        if (ended.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        return ended;
    }

    // A Campaign is Ended once every targeted Channel is terminal:
    //   Email        -> EmailTerminal flag (set by dispatch, #162)
    //   Banner/Popup -> past EndDate (an internal state change, no external call)
    private static bool AllChannelsTerminal(Campaign campaign, DateTimeOffset now)
    {
        var channels = CampaignMapper.ParseChannels(campaign.Channels)
            .Select(c => Enum.Parse<CampaignChannel>(c))
            .ToList();
        if (channels.Count == 0)
        {
            return false;
        }

        foreach (var channel in channels)
        {
            var terminal = channel switch
            {
                CampaignChannel.Email => campaign.EmailTerminal,
                _ => campaign.EndDate.HasValue && campaign.EndDate.Value <= now,
            };
            if (!terminal)
            {
                return false;
            }
        }
        return true;
    }

    private async Task EnsureNoActiveOverlapAsync(
        Campaign campaign,
        CampaignChannel channel,
        CancellationToken cancellationToken)
    {
        var channelName = channel.ToString();
        var actives = await dbContext.Campaigns
            .Where(c => c.Status == CampaignStatus.Active && c.Id != campaign.Id)
            .ToListAsync(cancellationToken);

        foreach (var other in actives)
        {
            var otherChannels = CampaignMapper.ParseChannels(other.Channels);
            if (!otherChannels.Contains(channelName))
            {
                continue;
            }
            if (WindowsOverlap(campaign.StartDate, campaign.EndDate, other.StartDate, other.EndDate))
            {
                throw new InvalidOperationException(
                    $"Another {channelName} campaign is already active for an overlapping window.");
            }
        }
    }

    // Treat a null bound as open-ended. Two windows overlap unless one ends before
    // the other starts.
    private static bool WindowsOverlap(
        DateTimeOffset? aStart, DateTimeOffset? aEnd,
        DateTimeOffset? bStart, DateTimeOffset? bEnd)
    {
        if (aEnd.HasValue && bStart.HasValue && aEnd.Value < bStart.Value)
        {
            return false;
        }
        if (bEnd.HasValue && aStart.HasValue && bEnd.Value < aStart.Value)
        {
            return false;
        }
        return true;
    }

    private async Task<string?> ResolveEmailAudienceAsync(Campaign campaign, CancellationToken cancellationToken)
    {
        var recipients = new List<string>();

        if (campaign.TargetSegmentId.HasValue)
        {
            var members = await segmentService.GetSegmentMembersAsync(
                campaign.TargetSegmentId.Value, cancellationToken);
            if (members is not null)
            {
                recipients.AddRange(members
                    .Where(m => !string.IsNullOrWhiteSpace(m.Email))
                    .Select(m => m.Email!));
            }
        }

        var explicitEmails = CampaignMapper.ParseEmails(campaign.TargetEmails);
        if (explicitEmails is not null)
        {
            recipients.AddRange(explicitEmails);
        }

        return CampaignMapper.SerializeEmails(recipients) is { Length: > 0 } json ? json : null;
    }

    public async Task<IReadOnlyList<DueCampaignDto>> GetDueEmailCampaignsAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var active = await dbContext.Campaigns
            .Include(c => c.ChannelContents)
            .Where(c => c.Status == CampaignStatus.Active && !c.EmailTerminal)
            .ToListAsync(cancellationToken);

        // Opt-out set: emails of Contacts who opted out of marketing.
        var optedOut = await dbContext.Contacts
            .Where(c => c.MarketingOptOut && c.Email != null)
            .Select(c => c.Email!)
            .ToListAsync(cancellationToken);
        var optOutSet = optedOut
            .Select(e => e.Trim().ToLowerInvariant())
            .ToHashSet();

        var due = new List<DueCampaignDto>();
        foreach (var campaign in active)
        {
            var channels = CampaignMapper.ParseChannels(campaign.Channels);
            if (!channels.Contains(nameof(CampaignChannel.Email)))
            {
                continue;
            }
            // NextRunAt null is treated as "not scheduled yet"; only send when due.
            if (campaign.NextRunAt is null || campaign.NextRunAt > now)
            {
                continue;
            }

            var snapshot = CampaignMapper.ParseEmails(campaign.ResolvedRecipients) ?? new List<string>();
            var recipients = snapshot
                .Select(e => e.Trim().ToLowerInvariant())
                .Where(e => e.Length > 0 && !optOutSet.Contains(e))
                .Distinct()
                .ToList();

            var emailContent = campaign.ChannelContents
                .FirstOrDefault(cc => cc.Channel == CampaignChannel.Email);

            due.Add(new DueCampaignDto(
                campaign.Id,
                campaign.Title,
                emailContent?.Subject ?? campaign.Title,
                emailContent?.Body ?? string.Empty,
                recipients));
        }

        return due;
    }

    public async Task<bool> RecordDispatchResultAsync(
        Guid id,
        CampaignDispatchResultDto result,
        CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns.FindAsync([id], cancellationToken);
        if (campaign is null)
        {
            return false;
        }

        campaign.DispatchSentCount = result.SentCount;
        campaign.DispatchFailedCount = result.FailedCount;
        campaign.DispatchErrors = result.Errors is { Count: > 0 }
            ? System.Text.Json.JsonSerializer.Serialize(result.Errors)
            : null;
        campaign.DispatchedAt = DateTimeOffset.UtcNow;
        // The Email channel is now terminal (sent-or-failed), regardless of
        // individual failures — feeds the cross-Channel Ended aggregation.
        campaign.EmailTerminal = true;
        // Don't pick it up again on the next sweep.
        campaign.NextRunAt = null;
        campaign.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<ActiveChannelContentDto?> GetActiveChannelContentAsync(
        string channel,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<CampaignChannel>(channel?.Trim(), ignoreCase: true, out var parsed)
            || parsed == CampaignChannel.Email)
        {
            // Only Banner/Popup are storefront channels.
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var channelName = parsed.ToString();

        var actives = await dbContext.Campaigns
            .Include(c => c.ChannelContents)
            .Where(c => c.Status == CampaignStatus.Active)
            .ToListAsync(cancellationToken);

        // The single Active campaign targeting this channel whose window covers now.
        var match = actives
            .Where(c => CampaignMapper.ParseChannels(c.Channels).Contains(channelName))
            .Where(c => (c.StartDate is null || c.StartDate <= now)
                     && (c.EndDate is null || c.EndDate > now))
            .OrderBy(c => c.StartDate ?? c.CreatedAt)
            .FirstOrDefault();

        var content = match?.ChannelContents.FirstOrDefault(cc => cc.Channel == parsed);
        if (match is null || content is null)
        {
            return null;
        }

        return new ActiveChannelContentDto(
            match.Id,
            channelName,
            content.Heading,
            content.Body,
            content.ImageUrl,
            content.LinkUrl,
            content.CtaText,
            content.CtaUrl,
            content.Dismissible);
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
