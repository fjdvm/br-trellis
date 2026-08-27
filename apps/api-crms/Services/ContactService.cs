using api_crms.Data;
using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class ContactService(
    IContactRepository contactRepository,
    AppDbContext dbContext) : IContactService
{
    public async Task<IReadOnlyList<ContactListItemDto>> ListContactsAsync(
        CancellationToken cancellationToken)
    {
        var contacts = await contactRepository.ListContactsAsync(cancellationToken);
        return ContactMapper.ToListItems(contacts);
    }

    public async Task<ContactDetailDto?> GetContactByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var contact = await contactRepository.GetContactByIdAsync(id, cancellationToken);
        return contact is null ? null : ContactMapper.ToDetail(contact);
    }

    public async Task<ContactDetailDto> CreateContactAsync(
        CreateContactDto input,
        CancellationToken cancellationToken)
    {
        if (input.CompanyId.HasValue)
        {
            await ValidateCompanyNotArchived(input.CompanyId.Value, cancellationToken);
        }

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = string.IsNullOrWhiteSpace(input.Name) ? null : input.Name.Trim(),
            Email = string.IsNullOrWhiteSpace(input.Email) ? null : input.Email.Trim().ToLowerInvariant(),
            Phone = NormalizePhone(input.Phone),
            CompanyId = input.CompanyId,
        };

        dbContext.Contacts.Add(contact);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ContactMapper.ToDetail(contact);
    }

    public async Task<ContactDetailDto?> UpdateContactAsync(
        Guid id,
        UpdateContactDto input,
        CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts.FindAsync([id], cancellationToken);
        if (contact is null || contact.DeletedAt is not null)
        {
            return null;
        }

        if (input.CompanyId.HasValue)
        {
            await ValidateCompanyNotArchived(input.CompanyId.Value, cancellationToken);
            contact.CompanyId = input.CompanyId.Value;
        }

        contact.Name = string.IsNullOrWhiteSpace(input.Name) ? contact.Name : input.Name.Trim();
        contact.Email = string.IsNullOrWhiteSpace(input.Email) ? contact.Email : input.Email.Trim().ToLowerInvariant();
        contact.Phone = string.IsNullOrWhiteSpace(input.Phone) ? contact.Phone : NormalizePhone(input.Phone);

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await contactRepository.GetContactByIdAsync(id, cancellationToken);
        return full is null ? null : ContactMapper.ToDetail(full);
    }

    public async Task<bool> DeleteContactAsync(Guid id, CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts.FindAsync([id], cancellationToken);
        if (contact is null || contact.DeletedAt is not null)
        {
            return false;
        }

        contact.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string? NormalizePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        var digits = phone.Trim().Where(char.IsDigit).ToArray();
        return digits.Length == 0 ? null : new string(digits);
    }

    private async Task ValidateCompanyNotArchived(Guid companyId, CancellationToken cancellationToken)
    {
        var company = await dbContext.Companies.FindAsync([companyId], cancellationToken);
        if (company is null)
        {
            throw new ArgumentException("Company does not exist.");
        }

        if (company.DeletedAt is not null)
        {
            throw new ArgumentException("Cannot assign contact to an archived company.");
        }
    }
}
