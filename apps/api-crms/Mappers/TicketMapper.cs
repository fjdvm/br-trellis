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
}
