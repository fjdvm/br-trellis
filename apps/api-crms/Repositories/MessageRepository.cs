using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class MessageRepository(AppDbContext dbContext) : IMessageRepository
{
    public async Task<bool> TicketExistsAsync(Guid ticketId, CancellationToken cancellationToken)
    {
        return await dbContext.Tickets.AnyAsync(t => t.Id == ticketId, cancellationToken);
    }

    public async Task<bool> ContactExistsAsync(Guid contactId, CancellationToken cancellationToken)
    {
        return await dbContext.Contacts
            .AnyAsync(c => c.Id == contactId && c.DeletedAt == null, cancellationToken);
    }

    public async Task AddMessageAsync(Message message, CancellationToken cancellationToken)
    {
        dbContext.Messages.Add(message);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Message>> ListMessagesAsync(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        var messages = await dbContext.Messages.AsNoTracking()
            .Where(m => m.TicketId == ticketId)
            .ToListAsync(cancellationToken);

        // Order client-side: SQLite cannot ORDER BY DateTimeOffset in SQL.
        return messages
            .OrderBy(m => m.SentAt)
            .ToList();
    }
}
