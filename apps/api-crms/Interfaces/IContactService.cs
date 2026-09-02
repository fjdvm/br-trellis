using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IContactService
{
    Task<IReadOnlyList<ContactListItemDto>> ListContactsAsync(CancellationToken cancellationToken);

    Task<ContactDetailDto?> GetContactByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<ContactDetailDto> CreateContactAsync(CreateContactDto input, CancellationToken cancellationToken);

    Task<ContactDetailDto?> UpdateContactAsync(Guid id, UpdateContactDto input, CancellationToken cancellationToken);

    Task<bool> DeleteContactAsync(Guid id, CancellationToken cancellationToken);

    // Sets the marketing opt-out flag on every (non-deleted) Contact matching the
    // given email (normalized). Idempotent; returns the number of contacts updated.
    // Called (server-to-server) when a shopper clicks an unsubscribe link.
    Task<int> SetMarketingOptOutByEmailAsync(string email, CancellationToken cancellationToken);
}
