using api_crms.CustomerIdentity.Persistence;
using api_crms.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class CustomerIdentityRepository(CustomerIdentityDbContext dbContext)
    : ICustomerIdentityRepository
{
    public Task<SourceReference?> FindActiveSourceReferenceAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken)
    {
        return dbContext.SourceReferences.AsNoTracking().SingleOrDefaultAsync(reference =>
            reference.DeletedAt == null &&
            reference.SourceSystem == sourceSystem &&
            reference.SourceId == sourceId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Customer>> ListActiveCustomersAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Customers.AsNoTracking()
            .Where(customer => customer.DeletedAt == null)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SourceReference>> ListPendingReviewSourceReferencesAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.SourceReferences.AsNoTracking()
            .Where(reference => reference.DeletedAt == null)
            .Where(reference => reference.Status == SourceReferenceStatus.PendingReview)
            .Include(reference => reference.Customer)
            .Include(reference => reference.IdentityMatchCandidates
                .Where(candidate => candidate.DeletedAt == null))
                .ThenInclude(candidate => candidate.CandidateCustomer)
            .ToListAsync(cancellationToken);
    }

    public void AddCustomer(Customer customer) => dbContext.Customers.Add(customer);

    public void AddSourceReference(SourceReference sourceReference) =>
        dbContext.SourceReferences.Add(sourceReference);

    public void AddIdentityMatchCandidates(IEnumerable<IdentityMatchCandidate> candidates) =>
        dbContext.IdentityMatchCandidates.AddRange(candidates);

    public async Task<Guid?> SaveChangesOrGetConcurrentCustomerIdAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return null;
        }
        catch (DbUpdateException)
        {
            dbContext.ChangeTracker.Clear();
            return (await FindActiveSourceReferenceAsync(sourceSystem, sourceId, cancellationToken))?.CustomerId;
        }
    }
}
