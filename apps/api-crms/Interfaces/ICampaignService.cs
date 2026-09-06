using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ICampaignService
{
    Task<IReadOnlyList<CampaignListItemDto>> ListCampaignsAsync(string? status, CancellationToken cancellationToken);

    Task<CampaignDetailDto?> GetCampaignByIdAsync(Guid id, CancellationToken cancellationToken);

    // Creates a new Campaign, always in Draft.
    Task<CampaignDetailDto> CreateCampaignAsync(CreateCampaignDto input, string? createdById, CancellationToken cancellationToken);

    // Updates a Draft Campaign. Returns null if not found. Throws if not a Draft.
    Task<CampaignDetailDto?> UpdateCampaignAsync(Guid id, UpdateCampaignDto input, CancellationToken cancellationToken);

    Task<bool> DeleteCampaignAsync(Guid id, CancellationToken cancellationToken);

    // Launches a Draft campaign (Draft -> Active): snapshots the Email audience
    // into ResolvedRecipients and enforces single-active-per-channel for
    // Banner/Popup. Returns null if not found; throws InvalidOperationException
    // on an illegal transition or a single-active-per-channel conflict.
    Task<CampaignDetailDto?> LaunchCampaignAsync(Guid id, CancellationToken cancellationToken);

    // Internal lifecycle sweep (no external calls): flips Banner/Popup channels
    // terminal once their EndDate passes and moves a Campaign to Ended once every
    // targeted channel is terminal. Returns the ids of campaigns moved to Ended.
    Task<IReadOnlyList<Guid>> SweepCampaignLifecycleAsync(CancellationToken cancellationToken);

    // Active Email campaigns due to send now (NextRunAt <= now, not yet terminal),
    // with recipients resolved from the launch snapshot, deduped and opt-out-filtered,
    // plus the Email subject/body. Polled by api-oos's dispatch sweep (ADR 0008).
    Task<IReadOnlyList<DueCampaignDto>> GetDueEmailCampaignsAsync(CancellationToken cancellationToken);

    // Records the outcome of a bulk Email dispatch reported by api-oos, marks the
    // Email channel terminal (feeds #161 aggregation), and clears NextRunAt.
    Task<bool> RecordDispatchResultAsync(
        Guid id,
        CampaignDispatchResultDto result,
        CancellationToken cancellationToken);

    // Internal dispatch pass (ADR 0009): finds every due Email Campaign, sends each
    // directly via Brevo, and records the outcome in-process (marking the Email
    // channel terminal). Returns the number of Campaigns dispatched. Driven by the
    // lifecycle sweep; SendNow is simply a Campaign already due on the next tick.
    Task<int> DispatchDueEmailCampaignsAsync(CancellationToken cancellationToken);

    // The currently-Active content for a storefront Channel (Banner or Popup):
    // the single Active campaign targeting that channel whose window covers now.
    // Returns null when nothing is active. Served to web-shop via api-oos (#163).
    Task<ActiveChannelContentDto?> GetActiveChannelContentAsync(
        string channel,
        CancellationToken cancellationToken);

    // Renders arbitrary block/body content exactly as the real dispatch/storefront
    // path would (EmailBodyRenderer), so the composer's live preview and the actual
    // sent/displayed output can never silently diverge. Pure/stateless — no DB access.
    string RenderPreviewHtml(string? content, string? theme = null);

    // Records an open/click engagement event relayed from Brevo via api-oos (#164).
    // Returns false if the campaign doesn't exist.
    Task<bool> RecordEventAsync(Guid campaignId, CampaignEventDto input, CancellationToken cancellationToken);

    // Full open/click/engagement analytics for one Campaign.
    Task<CampaignAnalyticsDto?> GetAnalyticsAsync(Guid campaignId, CancellationToken cancellationToken);

    // Lightweight engagement metrics for a set of campaigns (Campaigns list).
    Task<IReadOnlyList<CampaignEngagementMetricsDto>> GetEngagementMetricsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken);
}
