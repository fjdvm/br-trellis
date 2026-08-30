using api_crms.Enums;

namespace api_crms.Models;

public sealed class Ticket
{
    public Guid Id { get; set; }

    public Guid? ContactId { get; set; }

    public Contact? Contact { get; set; }

    public string Subject { get; set; } = string.Empty;

    public string? ExternalThreadId { get; set; }

    public TicketStatus Status { get; set; }

    public WaitingOn WaitingOn { get; set; }

    /// <summary>
    /// The channel a ticket originated from. Set once at creation and never
    /// changed afterward — a fixed record of origin, distinct from the
    /// lifecycle fields Status/WaitingOn.
    /// </summary>
    public TicketSource Source { get; set; }

    public string? AssignedToId { get; set; }

    public string? AssignedToName { get; set; }

    public string? AssignedToEmail { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Message> Messages { get; } = new List<Message>();
}
