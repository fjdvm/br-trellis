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
}
