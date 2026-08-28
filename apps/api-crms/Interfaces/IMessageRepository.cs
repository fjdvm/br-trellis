using api_crms.Models;

namespace api_crms.Interfaces;

public interface IMessageRepository
{
    Task<bool> TicketExistsAsync(Guid ticketId, CancellationToken cancellationToken);

    Task<bool> ContactExistsAsync(Guid contactId, CancellationToken cancellationToken);

    Task AddMessageAsync(Message message, CancellationToken cancellationToken);

    Task<IReadOnlyList<Message>> ListMessagesAsync(Guid ticketId, CancellationToken cancellationToken);
}
