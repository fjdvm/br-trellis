using api_crms.Models;

namespace api_crms.Interfaces;

public interface IContactIdentityRepository
{
    Task<SourceReference?> FindActiveSourceReferenceAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Contact>> ListActiveContactsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<SourceReference>> ListPendingReviewSourceReferencesAsync(
        CancellationToken cancellationToken);

    void AddContact(Contact contact);

    /// <summary>
    /// Fills in a matched Contact's missing <c>Name</c>/<c>Email</c>/<c>Phone</c>
    /// from a newly-observed source, without overwriting values it already has.
    /// Returns true when at least one field was updated (and persisted). Used so a
    /// Contact first seen without a name (e.g. an order that only carried an email)
    /// stops showing as "unnamed" once a source supplies the name.
    /// </summary>
    Task<bool> BackfillContactDetailsAsync(
        Guid contactId,
        string? name,
        string? email,
        string? phone,
        CancellationToken cancellationToken);

    /// <summary>
    /// Overwrites a Contact's <c>Name</c>/<c>Phone</c> with values a source
    /// explicitly changed (e.g. the shopper edited their profile). Unlike
    /// <see cref="BackfillContactDetailsAsync"/> this replaces existing values.
    /// Only non-blank incoming values are applied, so an update that omits a
    /// field leaves it untouched. Returns true when a field changed.
    /// </summary>
    Task<bool> OverwriteContactDetailsAsync(
        Guid contactId,
        string? name,
        string? phone,
        CancellationToken cancellationToken);

    /// <summary>
    /// Clears a Contact's <c>DeletedAt</c> so a soft-deleted Contact becomes active
    /// again. Used to resurrect a Contact that was deleted in the CRM but still
    /// exists in the source system, when a fresh source event resolves to it.
    /// Returns true when the Contact was soft-deleted and is now restored.
    /// </summary>
    Task<bool> RestoreContactAsync(Guid contactId, CancellationToken cancellationToken);

    /// <summary>
    /// Soft-deletes the Contact linked to the given source reference (and the
    /// reference itself) so a delete in the source system propagates to the CRM and
    /// won't be resurrected by a stale reference. Returns true when a Contact was
    /// found and soft-deleted.
    /// </summary>
    Task<bool> DeleteContactBySourceAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken);

    void AddSourceReference(SourceReference sourceReference);

    void AddIdentityMatchCandidates(IEnumerable<IdentityMatchCandidate> candidates);

    Task<Guid?> SaveChangesOrGetConcurrentContactIdAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken);
}
