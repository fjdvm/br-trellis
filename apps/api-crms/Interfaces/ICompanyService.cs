using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ICompanyService
{
    Task<IReadOnlyList<CompanyListItemDto>> ListCompaniesAsync(bool includeArchived, CancellationToken cancellationToken);

    Task<CompanyDetailDto?> GetCompanyByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<CompanyDetailDto> CreateCompanyAsync(CreateCompanyDto input, CancellationToken cancellationToken);

    Task<CompanyDetailDto?> UpdateCompanyAsync(Guid id, UpdateCompanyDto input, CancellationToken cancellationToken);

    Task<bool> ArchiveCompanyAsync(Guid id, CancellationToken cancellationToken);
}
