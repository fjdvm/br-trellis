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

    /// <summary>
    /// Returns messages on a ticket added strictly after <paramref name="since"/>
    /// (or all messages when <paramref name="since"/> is null), ordered oldest-first.
    /// Returns null when the ticket does not exist. Used by api-oos's staff-reply
    /// polling loop.
    /// </summary>
    Task<IReadOnlyList<MessageDto>?> ListMessagesSinceAsync(
        Guid ticketId,
        DateTimeOffset? since,
        CancellationToken cancellationToken);

    /// <summary>
    /// Returns messages on the ticket identified by its external conversation id
    /// (<c>ExternalThreadId</c>) added strictly after <paramref name="since"/> (or all
    /// when null), oldest-first. Returns null when no such conversation exists. This is
    /// the shape api-oos's staff-reply polling loop calls (it knows the conversation id,
    /// not the internal ticket GUID).
    /// </summary>
    Task<IReadOnlyList<MessageDto>?> ListMessagesByConversationSinceAsync(
        string conversationId,
        DateTimeOffset? since,
        CancellationToken cancellationToken);
}
