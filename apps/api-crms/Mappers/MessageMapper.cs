using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class MessageMapper
{
    public static MessageDto ToDto(Message message)
    {
        return new MessageDto(
            message.Id,
            message.TicketId,
            message.SenderType.ToString(),
            message.SenderContactId,
            message.SenderStaffId,
            message.SenderStaffName,
            message.Content,
            message.SentAt);
    }

    public static IReadOnlyList<MessageDto> ToDtos(IEnumerable<Message> messages)
    {
        return messages.Select(ToDto).ToList();
    }
}
