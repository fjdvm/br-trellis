using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace api_crms.Repositories;

public sealed class TicketIngestionRepository(AppDbContext dbContext) : ITicketIngestionRepository
{
    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task<bool> HasProcessedEventAsync(string eventId, CancellationToken cancellationToken)
    {
        return await dbContext.ProcessedEvents
            .AnyAsync(e => e.EventId == eventId, cancellationToken);
    }

    public async Task MarkEventProcessedAsync(
        string eventId, string eventType, CancellationToken cancellationToken)
    {
        dbContext.ProcessedEvents.Add(new ProcessedEvent
        {
            EventId = eventId,
            EventType = eventType,
            ProcessedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Ticket?> GetTicketByThreadIdAsync(
        string threadId, CancellationToken cancellationToken)
    {
        // #148 / ADR 0006: resolve by either the stored ExternalThreadId or the Ticket's
        // own id — the single definition lives in TicketQueryExtensions.
        return await dbContext.Tickets.ResolveByConversationKeyAsync(threadId, cancellationToken);
    }

    public async Task AddTicketAsync(Ticket ticket, CancellationToken cancellationToken)
    {
        dbContext.Tickets.Add(ticket);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AddMessageAsync(Message message, CancellationToken cancellationToken)
    {
        dbContext.Messages.Add(message);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
