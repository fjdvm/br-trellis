using api_crms.Models;

namespace api_crms.Interfaces;

public interface ICompanyRepository
{
    Task<IReadOnlyList<Company>> ListCompaniesAsync(bool includeArchived, CancellationToken cancellationToken);

    Task<Company?> GetCompanyByIdAsync(Guid id, CancellationToken cancellationToken);
}
