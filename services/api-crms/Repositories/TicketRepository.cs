using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class TicketRepository(AppDbContext dbContext) : ITicketRepository
{
    public async Task<IReadOnlyList<Ticket>> ListTicketsAsync(
        TicketStatus? status,
        WaitingOn? waitingOn,
        TicketSource? source,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Tickets.AsNoTracking()
            .Include(t => t.Contact)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (waitingOn.HasValue)
        {
            query = query.Where(t => t.WaitingOn == waitingOn.Value);
        }

        if (source.HasValue)
        {
            query = query.Where(t => t.Source == source.Value);
        }

        var tickets = await query.ToListAsync(cancellationToken);

        // Order client-side: SQLite cannot ORDER BY DateTimeOffset in SQL.
        return tickets
            .OrderByDescending(t => t.CreatedAt)
            .ToList();
    }

    public async Task<Ticket?> GetTicketByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Tickets.AsNoTracking()
            .Include(t => t.Contact)
            .SingleOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task AddTicketAsync(Ticket ticket, CancellationToken cancellationToken)
    {
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ContactExistsAsync(Guid contactId, CancellationToken cancellationToken)
    {
        return await dbContext.Contacts
            .AnyAsync(c => c.Id == contactId && c.DeletedAt == null, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
