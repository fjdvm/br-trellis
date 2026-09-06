using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class ContactRepository(AppDbContext dbContext) : IContactRepository
{
    public async Task<IReadOnlyList<Contact>> ListContactsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Contacts.AsNoTracking()
            .Where(contact => contact.DeletedAt == null)
            .Include(contact => contact.Company)
            .Include(contact => contact.SourceReferences
                .Where(r => r.DeletedAt == null))
            .OrderBy(contact => contact.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Contact?> GetContactByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Contacts.AsNoTracking()
            .Where(contact => contact.DeletedAt == null && contact.Id == id)
            .Include(contact => contact.Company)
            .Include(contact => contact.SourceReferences
                .Where(r => r.DeletedAt == null))
            .Include(contact => contact.CustomFieldValues)
                .ThenInclude(v => v.Definition)
            .Include(contact => contact.CustomFieldValues)
                .ThenInclude(v => v.Option)
            .Include(contact => contact.TimelineEntries)
            .Include(contact => contact.Orders)
                .ThenInclude(o => o.LineItems)
            .SingleOrDefaultAsync(cancellationToken);
    }
}
