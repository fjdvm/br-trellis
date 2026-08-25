using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IContactService
{
    Task<IReadOnlyList<ContactListItemDto>> ListContactsAsync(CancellationToken cancellationToken);

    Task<ContactDetailDto?> GetContactByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<ContactDetailDto> CreateContactAsync(CreateContactDto input, CancellationToken cancellationToken);
}
