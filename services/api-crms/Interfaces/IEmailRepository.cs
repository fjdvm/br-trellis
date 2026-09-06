using api_crms.Models;
using Microsoft.EntityFrameworkCore.Storage;

namespace api_crms.Interfaces;

public interface IEmailRepository
{
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken);

    Task<bool> HasProcessedEventAsync(string eventId, CancellationToken cancellationToken);

    Task MarkEventProcessedAsync(string eventId, string eventType, CancellationToken cancellationToken);

    Task<Ticket?> GetTicketByThreadIdAsync(string threadId, CancellationToken cancellationToken);

    Task<bool> ContactExistsAsync(Guid contactId, CancellationToken cancellationToken);

    Task AddTicketAsync(Ticket ticket, CancellationToken cancellationToken);

    Task AddMessageAsync(Message message, CancellationToken cancellationToken);
}
