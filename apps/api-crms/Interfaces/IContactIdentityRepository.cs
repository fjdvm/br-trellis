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

    void AddSourceReference(SourceReference sourceReference);

    void AddIdentityMatchCandidates(IEnumerable<IdentityMatchCandidate> candidates);

    Task<Guid?> SaveChangesOrGetConcurrentContactIdAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken);
}
