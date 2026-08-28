using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IMessageService
{
    Task<MessageDto?> PostMessageAsync(
        Guid ticketId,
        PostMessageDto input,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MessageDto>?> ListMessagesAsync(
        Guid ticketId,
        CancellationToken cancellationToken);
}
