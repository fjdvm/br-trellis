using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class CompanyService(
    ICompanyRepository companyRepository,
    AppDbContext dbContext) : ICompanyService
{
    public async Task<IReadOnlyList<CompanyListItemDto>> ListCompaniesAsync(
        bool includeArchived,
        CancellationToken cancellationToken)
    {
        var companies = await companyRepository.ListCompaniesAsync(includeArchived, cancellationToken);
        return CompanyMapper.ToListItems(companies);
    }

    public async Task<CompanyDetailDto?> GetCompanyByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var company = await companyRepository.GetCompanyByIdAsync(id, cancellationToken);
        return company is null ? null : CompanyMapper.ToDetail(company);
    }

    public async Task<CompanyDetailDto> CreateCompanyAsync(
        CreateCompanyDto input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new ArgumentException("Company name is required.");
        }

        if (!Enum.TryParse<BuyerType>(input.BuyerType, ignoreCase: true, out var buyerType))
        {
            throw new ArgumentException($"Invalid BuyerType: '{input.BuyerType}'. Must be 'Institutional' or 'Individual'.");
        }

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = input.Name.Trim(),
            BuyerType = buyerType,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        if (input.PrimaryContactId.HasValue)
        {
            await ValidatePrimaryContact(input.PrimaryContactId.Value, company.Id, cancellationToken);
            company.PrimaryContactId = input.PrimaryContactId.Value;
        }

        dbContext.Companies.Add(company);
        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await companyRepository.GetCompanyByIdAsync(company.Id, cancellationToken);
        return CompanyMapper.ToDetail(full!);
    }

    public async Task<CompanyDetailDto?> UpdateCompanyAsync(
        Guid id,
        UpdateCompanyDto input,
        CancellationToken cancellationToken)
    {
        var company = await dbContext.Companies.FindAsync([id], cancellationToken);
        if (company is null || company.DeletedAt is not null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(input.Name))
        {
            company.Name = input.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(input.BuyerType))
        {
            if (!Enum.TryParse<BuyerType>(input.BuyerType, ignoreCase: true, out var buyerType))
            {
                throw new ArgumentException($"Invalid BuyerType: '{input.BuyerType}'. Must be 'Institutional' or 'Individual'.");
            }
            company.BuyerType = buyerType;
        }

        if (input.PrimaryContactId.HasValue)
        {
            await ValidatePrimaryContact(input.PrimaryContactId.Value, id, cancellationToken);
            company.PrimaryContactId = input.PrimaryContactId.Value;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await companyRepository.GetCompanyByIdAsync(id, cancellationToken);
        return full is null ? null : CompanyMapper.ToDetail(full);
    }

    public async Task<bool> ArchiveCompanyAsync(Guid id, CancellationToken cancellationToken)
    {
        var company = await dbContext.Companies.FindAsync([id], cancellationToken);
        if (company is null || company.DeletedAt is not null)
        {
            return false;
        }

        company.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ValidatePrimaryContact(
        Guid primaryContactId,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts.FindAsync([primaryContactId], cancellationToken);
        if (contact is null || contact.DeletedAt is not null)
        {
            throw new ArgumentException("Primary contact does not exist.");
        }

        if (contact.CompanyId != companyId)
        {
            throw new ArgumentException("Primary contact must belong to this company.");
        }
    }
}
