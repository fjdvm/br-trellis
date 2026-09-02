using api_crms.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace api_crms.Interfaces;

/// <summary>
/// Data access for shop-chat Ticket/Message ingestion. Deliberately separate from
/// <see cref="IEmailRepository"/> so the two conversation sources stay isolated,
/// even though they share the <c>Ticket</c>/<c>Message</c>/<c>ProcessedEvent</c> tables.
/// </summary>
public interface ITicketIngestionRepository
{
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken);

    Task<bool> HasProcessedEventAsync(string eventId, CancellationToken cancellationToken);

    Task MarkEventProcessedAsync(string eventId, string eventType, CancellationToken cancellationToken);

    Task<Ticket?> GetTicketByThreadIdAsync(string threadId, CancellationToken cancellationToken);

    Task AddTicketAsync(Ticket ticket, CancellationToken cancellationToken);

    Task AddMessageAsync(Message message, CancellationToken cancellationToken);

    /// <summary>
    /// Persists pending changes to already-tracked entities (e.g. a status flip on a
    /// ticket resolved via <see cref="GetTicketByThreadIdAsync"/>). The Add* methods
    /// save their own inserts; this is for in-place mutations that have no insert.
    /// </summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
