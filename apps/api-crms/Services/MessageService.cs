using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class MessageService(IMessageRepository messageRepository) : IMessageService
{
    public async Task<MessageDto?> PostMessageAsync(
        Guid ticketId,
        PostMessageDto input,
        CancellationToken cancellationToken)
    {
        if (!await messageRepository.TicketExistsAsync(ticketId, cancellationToken))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(input.Content))
        {
            throw new ArgumentException("Message content is required.");
        }

        if (!Enum.TryParse<MessageSenderType>(input.SenderType, ignoreCase: true, out var senderType))
        {
            throw new ArgumentException(
                $"Invalid SenderType: '{input.SenderType}'. Must be 'Contact' or 'Staff'.");
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            SenderType = senderType,
            Content = input.Content.Trim(),
            SentAt = DateTimeOffset.UtcNow,
        };

        if (senderType == MessageSenderType.Staff)
        {
            if (string.IsNullOrWhiteSpace(input.SenderStaffId))
            {
                throw new ArgumentException("Staff-authored messages require a SenderStaffId.");
            }

            message.SenderStaffId = input.SenderStaffId.Trim();
            message.SenderStaffName = input.SenderStaffName?.Trim();
        }
        else
        {
            // Contact-authored: SenderContactId may be null (e.g. an unlinked ticket).
            // When provided, it must reference an existing Contact.
            if (input.SenderContactId.HasValue
                && !await messageRepository.ContactExistsAsync(
                    input.SenderContactId.Value, cancellationToken))
            {
                throw new ArgumentException("Sender contact does not exist.");
            }

            message.SenderContactId = input.SenderContactId;
        }

        await messageRepository.AddMessageAsync(message, cancellationToken);
        return MessageMapper.ToDto(message);
    }

    public async Task<IReadOnlyList<MessageDto>?> ListMessagesAsync(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        if (!await messageRepository.TicketExistsAsync(ticketId, cancellationToken))
        {
            return null;
        }

        var messages = await messageRepository.ListMessagesAsync(ticketId, cancellationToken);
        return MessageMapper.ToDtos(messages);
    }
}
