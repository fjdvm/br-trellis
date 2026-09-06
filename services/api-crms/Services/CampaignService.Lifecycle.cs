using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Mappers;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed partial class CampaignService
{
    // Launch + lifecycle (Draft -> Active -> Ended), audience snapshot, and the
    // single-active-per-Channel window check. See ICampaignService / #161.
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
        else if (!string.IsNullOrWhiteSpace(campaign.TargetSegmentPreset))
        {
            var preset = campaign.TargetSegmentPreset.Trim().ToLowerInvariant();
            IQueryable<Contact> query = dbContext.Contacts.AsNoTracking()
                .Where(c => c.DeletedAt == null && c.Email != null && c.Email != "");

            if (preset == "contacts")
            {
                query = query.Where(c => c.CompanyId == null);
            }
            else if (preset == "companies")
            {
                query = query.Where(c => c.CompanyId != null);
            }
            else if (preset == "ecommerce")
            {
                query = query.Where(c => c.Orders.Any());
            }

            var presetEmails = await query.Select(c => c.Email!).ToListAsync(cancellationToken);
            recipients.AddRange(presetEmails);
        }

        var explicitEmails = CampaignMapper.ParseEmails(campaign.TargetEmails);
        if (explicitEmails is not null)
        {
            recipients.AddRange(explicitEmails);
        }

        return CampaignMapper.SerializeEmails(recipients) is { Length: > 0 } json ? json : null;
    }

}
