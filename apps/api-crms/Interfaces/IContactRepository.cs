using api_crms.Models;

namespace api_crms.Interfaces;

public interface IContactRepository
{
    Task<IReadOnlyList<Contact>> ListContactsAsync(CancellationToken cancellationToken);

    Task<Contact?> GetContactByIdAsync(Guid id, CancellationToken cancellationToken);
}
