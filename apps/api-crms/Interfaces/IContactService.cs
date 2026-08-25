using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IContactService
{
    Task<IReadOnlyList<ContactListItemDto>> ListContactsAsync(CancellationToken cancellationToken);

    Task<ContactDetailDto?> GetContactByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<ContactDetailDto> CreateContactAsync(CreateContactDto input, CancellationToken cancellationToken);

    Task<ContactDetailDto?> UpdateContactAsync(Guid id, UpdateContactDto input, CancellationToken cancellationToken);

    Task<bool> DeleteContactAsync(Guid id, CancellationToken cancellationToken);
}
