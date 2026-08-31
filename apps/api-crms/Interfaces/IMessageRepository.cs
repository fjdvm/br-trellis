using api_crms.Models;

namespace api_crms.Interfaces;

public interface IMessageRepository
{
    Task<bool> TicketExistsAsync(Guid ticketId, CancellationToken cancellationToken);

    Task<bool> ContactExistsAsync(Guid contactId, CancellationToken cancellationToken);

    Task AddMessageAsync(Message message, CancellationToken cancellationToken);

    Task<IReadOnlyList<Message>> ListMessagesAsync(Guid ticketId, CancellationToken cancellationToken);

    Task<IReadOnlyList<Message>> ListMessagesSinceAsync(
        Guid ticketId, DateTimeOffset? since, CancellationToken cancellationToken);

    /// <summary>Resolves a ticket's internal id from its external conversation id, or null.</summary>
    Task<Guid?> GetTicketIdByExternalThreadAsync(
        string conversationId, CancellationToken cancellationToken);
}
