using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class CompanyRepository(AppDbContext dbContext) : ICompanyRepository
{
    public async Task<IReadOnlyList<Company>> ListCompaniesAsync(
        bool includeArchived,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Companies.AsNoTracking()
            .Include(c => c.Contacts.Where(ct => ct.DeletedAt == null))
            .AsQueryable();

        if (!includeArchived)
        {
            query = query.Where(c => c.DeletedAt == null);
        }

        return await query
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Company?> GetCompanyByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Companies.AsNoTracking()
            .Where(c => c.Id == id)
            .Include(c => c.PrimaryContact)
            .Include(c => c.Contacts.Where(ct => ct.DeletedAt == null))
            .SingleOrDefaultAsync(cancellationToken);
    }
}
