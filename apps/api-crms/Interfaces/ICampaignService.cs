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
}
