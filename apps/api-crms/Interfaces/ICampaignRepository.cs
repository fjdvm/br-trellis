using api_crms.Enums;
using api_crms.Models;

namespace api_crms.Interfaces;

public interface ICampaignRepository
{
    Task<IReadOnlyList<Campaign>> ListAsync(CampaignStatus? status, CancellationToken cancellationToken);

    // Detail read includes the ChannelContents children.
    Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
