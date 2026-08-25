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
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = string.IsNullOrWhiteSpace(input.Name) ? null : input.Name.Trim(),
            Email = string.IsNullOrWhiteSpace(input.Email) ? null : input.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(input.Phone) ? null : input.Phone.Trim(),
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

        contact.Name = string.IsNullOrWhiteSpace(input.Name) ? contact.Name : input.Name.Trim();
        contact.Email = string.IsNullOrWhiteSpace(input.Email) ? contact.Email : input.Email.Trim();
        contact.Phone = string.IsNullOrWhiteSpace(input.Phone) ? contact.Phone : input.Phone.Trim();

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
}
