using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class ContactIdentityRepository(AppDbContext dbContext)
    : IContactIdentityRepository
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

    public async Task<IReadOnlyList<Contact>> ListActiveContactsAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.Contacts.AsNoTracking()
            .Where(contact => contact.DeletedAt == null)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SourceReference>> ListPendingReviewSourceReferencesAsync(
        CancellationToken cancellationToken)
    {
        return await dbContext.SourceReferences.AsNoTracking()
            .Where(reference => reference.DeletedAt == null)
            .Where(reference => reference.Status == SourceReferenceStatus.PendingReview)
            .Include(reference => reference.Contact)
            .Include(reference => reference.IdentityMatchCandidates
                .Where(candidate => candidate.DeletedAt == null))
                .ThenInclude(candidate => candidate.CandidateContact)
            .ToListAsync(cancellationToken);
    }

    public void AddContact(Contact contact) => dbContext.Contacts.Add(contact);

    public void AddSourceReference(SourceReference sourceReference) =>
        dbContext.SourceReferences.Add(sourceReference);

    public void AddIdentityMatchCandidates(IEnumerable<IdentityMatchCandidate> candidates) =>
        dbContext.IdentityMatchCandidates.AddRange(candidates);

    public async Task<Guid?> SaveChangesOrGetConcurrentContactIdAsync(
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
            return (await FindActiveSourceReferenceAsync(sourceSystem, sourceId, cancellationToken))?.ContactId;
        }
    }
}
