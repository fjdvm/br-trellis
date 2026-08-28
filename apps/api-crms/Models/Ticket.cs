using api_crms.Enums;

namespace api_crms.Models;

public sealed class Ticket
{
    public Guid Id { get; set; }

    public Guid? ContactId { get; set; }

    public Contact? Contact { get; set; }

    public string Subject { get; set; } = string.Empty;

    public TicketStatus Status { get; set; }

    public WaitingOn WaitingOn { get; set; }

    public string? AssignedToId { get; set; }

    public string? AssignedToName { get; set; }

    public string? AssignedToEmail { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Message> Messages { get; } = new List<Message>();
}
