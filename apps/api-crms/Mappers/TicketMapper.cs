using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class TicketMapper
{
    public static TicketListItemDto ToListItem(Ticket ticket)
    {
        return new TicketListItemDto(
            ticket.Id,
            ticket.Subject,
            ticket.Status.ToString(),
            ticket.WaitingOn.ToString(),
            ticket.Source.ToString(),
            ticket.AssignedToId,
            ticket.AssignedToName,
            ticket.AssignedToEmail,
            ticket.ContactId,
            ticket.Contact is null ? null : ToTicketContact(ticket.Contact),
            ticket.CreatedAt,
            ticket.UpdatedAt);
    }

    public static IReadOnlyList<TicketListItemDto> ToListItems(IEnumerable<Ticket> tickets)
    {
        return tickets.Select(ToListItem).ToList();
    }

    public static TicketDetailDto ToDetail(Ticket ticket)
    {
        return new TicketDetailDto(
            ticket.Id,
            ticket.Subject,
            ticket.Status.ToString(),
            ticket.WaitingOn.ToString(),
            ticket.Source.ToString(),
            ticket.AssignedToId,
            ticket.AssignedToName,
            ticket.AssignedToEmail,
            ticket.ContactId,
            ticket.Contact is null ? null : ToTicketContact(ticket.Contact),
            ticket.CreatedAt,
            ticket.UpdatedAt);
    }

    public static TicketContactDto ToTicketContact(Contact contact)
    {
        return new TicketContactDto(
            contact.Id,
            contact.Name,
            contact.Email);
    }

    /// <summary>
    /// Projects a ticket to the small summary payload the hub's ticket-list
    /// events carry (<c>NewTicketAvailable</c>/<c>TicketStatusChanged</c>). Uses the
    /// <c>Contact</c> navigation when it's loaded; ingestion paths that only set
    /// <c>ContactId</c> still send a usable summary (the Inbox has the contact id).
    /// </summary>
    public static TicketSummaryDto ToSummary(Ticket ticket)
    {
        return new TicketSummaryDto(
            ticket.Id,
            ticket.Subject,
            ticket.Status.ToString(),
            ticket.WaitingOn.ToString(),
            ticket.Source.ToString(),
            ticket.AssignedToId,
            ticket.AssignedToName,
            ticket.AssignedToEmail,
            ticket.ContactId,
            ticket.Contact is null ? null : ToTicketContact(ticket.Contact),
            ticket.CreatedAt,
            ticket.UpdatedAt);
    }
}
