using api_crms.Enums;
using api_crms.Models;

namespace api_crms.Interfaces;

public interface ITemplateRepository
{
    Task<IReadOnlyList<Template>> ListAsync(CampaignChannel? channel, CancellationToken cancellationToken);

    Task<Template?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
