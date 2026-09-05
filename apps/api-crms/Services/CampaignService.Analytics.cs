using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Helpers;
using api_crms.Mappers;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed partial class CampaignService
{
    // Cross-service dispatch (due/report, #162), storefront active content (#163),
    // and open/click analytics (#164).
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
            var body = await ResolveChannelBodyAsync(emailContent, cancellationToken) ?? string.Empty;

            due.Add(new DueCampaignDto(
                campaign.Id,
                campaign.Title,
                emailContent?.Subject ?? campaign.Title,
                body,
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

        var body = await ResolveChannelBodyAsync(content, cancellationToken);
        var renderedBody = EmailBodyRenderer.RenderToHtml(body, wrapContainer: false);

        return new ActiveChannelContentDto(
            match.Id,
            channelName,
            content.Heading,
            renderedBody,
            content.ImageUrl,
            content.LinkUrl,
            content.CtaText,
            content.CtaUrl,
            content.Dismissible);
    }

    // The real content source for a Channel: when the Channel content references a
    // Template (TemplateId), that Template's Blocks are the source of truth (#166) —
    // falling back to the flat Body field only when no Template is referenced or it
    // no longer exists. Used by both storefront display and Email dispatch so
    // neither one renders a stale/empty structural skeleton.
    private async Task<string?> ResolveChannelBodyAsync(
        CampaignChannelContent? content,
        CancellationToken cancellationToken)
    {
        if (content?.TemplateId is { } templateId)
        {
            var template = await dbContext.BlockTemplates
                .Include(t => t.Blocks)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == templateId, cancellationToken);
            if (template is not null)
            {
                return BlockTemplateContentRenderer.ToBlocksJson(template, content.Body);
            }
        }

        return content?.Body;
    }

    public async Task<bool> RecordEventAsync(
        Guid campaignId,
        CampaignEventDto input,
        CancellationToken cancellationToken)
    {
        var exists = await dbContext.Campaigns.AnyAsync(c => c.Id == campaignId, cancellationToken);
        if (!exists)
        {
            return false;
        }

        if (!Enum.TryParse<CampaignEventType>(input.EventType?.Trim(), ignoreCase: true, out var type))
        {
            throw new ArgumentException($"Unknown event type '{input.EventType}'.");
        }

        dbContext.CampaignEvents.Add(new CampaignEvent
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            EventType = type,
            Email = (input.Email ?? string.Empty).Trim().ToLowerInvariant(),
            Url = string.IsNullOrWhiteSpace(input.Url) ? null : input.Url.Trim(),
            OccurredAt = input.OccurredAt ?? DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CampaignAnalyticsDto?> GetAnalyticsAsync(Guid campaignId, CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns.AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var events = await dbContext.CampaignEvents.AsNoTracking()
            .Where(e => e.CampaignId == campaignId)
            .ToListAsync(cancellationToken);

        var sent = DenominatorFor(campaign);
        var opens = events.Where(e => e.EventType == CampaignEventType.Open).ToList();
        var clicks = events.Where(e => e.EventType == CampaignEventType.Click).ToList();

        var distinctOpens = opens.Select(e => e.Email).Distinct().Count();
        var distinctClicks = clicks.Select(e => e.Email).Distinct().Count();

        var engagementByDay = events
            .GroupBy(e => e.OccurredAt.UtcDateTime.Date)
            .OrderBy(g => g.Key)
            .Select(g => new EngagementByDayDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Count(e => e.EventType == CampaignEventType.Open),
                g.Count(e => e.EventType == CampaignEventType.Click)))
            .ToList();

        var totalClicks = clicks.Count;
        var linkPerformance = clicks
            .Where(e => !string.IsNullOrWhiteSpace(e.Url))
            .GroupBy(e => e.Url!)
            .Select(g => new LinkPerformanceDto(
                g.Key,
                g.Count(),
                g.Select(e => e.Email).Distinct().Count(),
                totalClicks == 0 ? 0 : Math.Round(100.0 * g.Count() / totalClicks, 1)))
            .OrderByDescending(l => l.TotalClicks)
            .ToList();

        return new CampaignAnalyticsDto(
            sent,
            distinctOpens,
            distinctClicks,
            Rate(distinctOpens, sent),
            Rate(distinctClicks, sent),
            engagementByDay,
            linkPerformance);
    }

    public async Task<IReadOnlyList<CampaignEngagementMetricsDto>> GetEngagementMetricsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken)
    {
        if (ids.Count == 0)
        {
            return Array.Empty<CampaignEngagementMetricsDto>();
        }

        var campaigns = await dbContext.Campaigns.AsNoTracking()
            .Where(c => ids.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var events = await dbContext.CampaignEvents.AsNoTracking()
            .Where(e => ids.Contains(e.CampaignId))
            .ToListAsync(cancellationToken);

        var byCampaign = events.GroupBy(e => e.CampaignId).ToDictionary(g => g.Key, g => g.ToList());

        return campaigns.Select(c =>
        {
            var sent = DenominatorFor(c);
            var evts = byCampaign.TryGetValue(c.Id, out var list) ? list : new List<CampaignEvent>();
            var opens = evts.Where(e => e.EventType == CampaignEventType.Open).Select(e => e.Email).Distinct().Count();
            var clicks = evts.Where(e => e.EventType == CampaignEventType.Click).Select(e => e.Email).Distinct().Count();
            return new CampaignEngagementMetricsDto(c.Id, sent, opens, clicks, Rate(opens, sent), Rate(clicks, sent));
        }).ToList();
    }

    // The open/click-rate denominator: the recorded dispatch count, else the
    // snapshotted recipient count (before any events exist).
    private static int DenominatorFor(Campaign campaign)
    {
        if (campaign.DispatchSentCount is > 0)
        {
            return campaign.DispatchSentCount.Value;
        }
        var recipients = CampaignMapper.ParseEmails(campaign.ResolvedRecipients);
        return recipients?.Count ?? 0;
    }

    private static double Rate(int numerator, int denominator)
    {
        return denominator == 0 ? 0 : Math.Round(100.0 * numerator / denominator, 1);
    }
}
