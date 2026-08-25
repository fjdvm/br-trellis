using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class ContactService(IContactRepository contactRepository) : IContactService
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
}
