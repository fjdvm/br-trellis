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

    public async Task<bool> BackfillContactDetailsAsync(
        Guid contactId,
        string? name,
        string? email,
        string? phone,
        CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts
            .SingleOrDefaultAsync(c => c.Id == contactId && c.DeletedAt == null, cancellationToken);
        if (contact is null)
        {
            return false;
        }

        var changed = false;
        // Only fill blanks — never overwrite a value the Contact already has.
        if (string.IsNullOrWhiteSpace(contact.Name) && !string.IsNullOrWhiteSpace(name))
        {
            contact.Name = name;
            changed = true;
        }
        if (string.IsNullOrWhiteSpace(contact.Email) && !string.IsNullOrWhiteSpace(email))
        {
            contact.Email = email;
            changed = true;
        }
        if (string.IsNullOrWhiteSpace(contact.Phone) && !string.IsNullOrWhiteSpace(phone))
        {
            contact.Phone = phone;
            changed = true;
        }

        if (changed)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        return changed;
    }

    public async Task<bool> RestoreContactAsync(Guid contactId, CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts
            .SingleOrDefaultAsync(c => c.Id == contactId, cancellationToken);
        if (contact is null || contact.DeletedAt is null)
        {
            return false;
        }

        contact.DeletedAt = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteContactBySourceAsync(
        string sourceSystem,
        string sourceId,
        CancellationToken cancellationToken)
    {
        var reference = await dbContext.SourceReferences
            .SingleOrDefaultAsync(r =>
                r.DeletedAt == null &&
                r.SourceSystem == sourceSystem &&
                r.SourceId == sourceId,
                cancellationToken);
        if (reference is null)
        {
            return false;
        }

        // Soft-delete the linked Contact. The source reference is left intact: the
        // shop account is gone, so no further shop events will arrive to resurrect it.
        // (Resurrection only fires for a CRM-side delete, where the shop keeps sending
        // events.) Retiring the reference here would collide with the unique
        // (source_system, source_id) index on any later re-link.
        var contact = await dbContext.Contacts
            .SingleOrDefaultAsync(c => c.Id == reference.ContactId, cancellationToken);
        if (contact is null || contact.DeletedAt is not null)
        {
            return false;
        }

        contact.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> OverwriteContactDetailsAsync(
        Guid contactId,
        string? name,
        string? phone,
        CancellationToken cancellationToken)
    {
        var contact = await dbContext.Contacts
            .SingleOrDefaultAsync(c => c.Id == contactId && c.DeletedAt == null, cancellationToken);
        if (contact is null)
        {
            return false;
        }

        var changed = false;
        // Replace existing values — the source explicitly changed them. Only apply
        // non-blank incoming values so an update omitting a field leaves it intact.
        if (!string.IsNullOrWhiteSpace(name) && contact.Name != name)
        {
            contact.Name = name;
            changed = true;
        }
        if (!string.IsNullOrWhiteSpace(phone) && contact.Phone != phone)
        {
            contact.Phone = phone;
            changed = true;
        }

        if (changed)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        return changed;
    }

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
