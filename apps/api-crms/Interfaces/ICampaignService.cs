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
}
