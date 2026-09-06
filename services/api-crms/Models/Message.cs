using api_crms.Enums;

namespace api_crms.Models;

public sealed class Message
{
    public Guid Id { get; set; }

    public Guid TicketId { get; set; }

    public Ticket? Ticket { get; set; }

    public MessageSenderType SenderType { get; set; }

    public Guid? SenderContactId { get; set; }

    public Contact? SenderContact { get; set; }

    public string? SenderStaffId { get; set; }

    public string? SenderStaffName { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTimeOffset SentAt { get; set; }
}
