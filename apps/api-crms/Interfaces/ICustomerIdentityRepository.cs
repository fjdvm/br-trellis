using api_crms.CustomerIdentity.Persistence;

namespace api_crms.Interfaces;

public interface ICustomerIdentityRepository
{
    Task<SourceReference?> FindActiveSourceReferenceAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Customer>> ListActiveCustomersAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<SourceReference>> ListPendingReviewSourceReferencesAsync(
        CancellationToken cancellationToken);

    void AddCustomer(Customer customer);

    void AddSourceReference(SourceReference sourceReference);

    void AddIdentityMatchCandidates(IEnumerable<IdentityMatchCandidate> candidates);

    Task<Guid?> SaveChangesOrGetConcurrentCustomerIdAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken);
}
