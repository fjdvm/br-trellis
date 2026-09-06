using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class CompanyMapper
{
    public static CompanyListItemDto ToListItem(Company company)
    {
        return new CompanyListItemDto(
            company.Id,
            company.Name,
            company.BuyerType.ToString(),
            company.Contacts.Count,
            company.CreatedAt);
    }

    public static IReadOnlyList<CompanyListItemDto> ToListItems(IEnumerable<Company> companies)
    {
        return companies.Select(ToListItem).ToList();
    }

    public static CompanyDetailDto ToDetail(Company company)
    {
        return new CompanyDetailDto(
            company.Id,
            company.Name,
            company.BuyerType.ToString(),
            company.PrimaryContactId,
            company.PrimaryContact is null
                ? null
                : ToCompanyContact(company.PrimaryContact),
            company.CreatedAt,
            company.DeletedAt,
            company.Contacts
                .Where(c => c.DeletedAt == null)
                .OrderBy(c => c.Name)
                .Select(ToCompanyContact)
                .ToList());
    }

    public static CompanyContactDto ToCompanyContact(Contact contact)
    {
        return new CompanyContactDto(
            contact.Id,
            contact.Name,
            contact.Email,
            contact.Phone,
            contact.LifetimeValue);
    }
}
