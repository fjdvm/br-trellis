using api_crms.DTOs;
using api_crms.Services;

namespace api_crms.Interfaces;

public interface IContactIdentityService
{
    Task<ResolveOrCreateContactResult> ResolveOrCreateContactAsync(
        ResolveOrCreateContactCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Applies an explicit detail change from a source (e.g. the shopper edited
    /// their profile). When the source is already linked to a Contact, that
    /// Contact's Name/Phone are overwritten. When it isn't yet known, the Contact
    /// is resolved/created so the edit still surfaces.
    /// </summary>
    Task<ResolveOrCreateContactResult> UpdateContactFromSourceAsync(
        ResolveOrCreateContactCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Propagates a delete from the source system: soft-deletes the CRM Contact
    /// linked to the given source (and retires the source reference) so it won't be
    /// resurrected. A no-op when the source isn't linked to any Contact.
    /// </summary>
    Task DeleteContactFromSourceAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PendingReviewContact>> ListPendingReviewContactsAsync(
        CancellationToken cancellationToken = default);
}
