using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;

namespace api_crms.Services;

public sealed class TicketService(
    ITicketRepository ticketRepository,
    AppDbContext dbContext) : ITicketService
{
    public async Task<IReadOnlyList<TicketListItemDto>> ListTicketsAsync(
        string? status,
        string? waitingOn,
        CancellationToken cancellationToken)
    {
        TicketStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<TicketStatus>(status, ignoreCase: true, out var parsedStatus))
            {
                throw new ArgumentException($"Invalid Status: '{status}'.");
            }
            statusFilter = parsedStatus;
        }

        WaitingOn? waitingOnFilter = null;
        if (!string.IsNullOrWhiteSpace(waitingOn))
        {
            if (!Enum.TryParse<WaitingOn>(waitingOn, ignoreCase: true, out var parsedWaitingOn))
            {
                throw new ArgumentException($"Invalid WaitingOn: '{waitingOn}'.");
            }
            waitingOnFilter = parsedWaitingOn;
        }

        var tickets = await ticketRepository.ListTicketsAsync(
            statusFilter, waitingOnFilter, cancellationToken);
        return TicketMapper.ToListItems(tickets);
    }

    public async Task<TicketDetailDto?> GetTicketByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ticket = await ticketRepository.GetTicketByIdAsync(id, cancellationToken);
        return ticket is null ? null : TicketMapper.ToDetail(ticket);
    }

    public async Task<TicketDetailDto> CreateTicketAsync(
        CreateTicketDto input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Subject))
        {
            throw new ArgumentException("Ticket subject is required.");
        }

        if (input.ContactId.HasValue
            && !await ticketRepository.ContactExistsAsync(input.ContactId.Value, cancellationToken))
        {
            throw new ArgumentException("Contact does not exist.");
        }

        var now = DateTimeOffset.UtcNow;
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            ContactId = input.ContactId,
            Subject = input.Subject.Trim(),
            Status = TicketStatus.Unclaimed,
            WaitingOn = WaitingOn.None,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await ticketRepository.AddTicketAsync(ticket, cancellationToken);

        var full = await ticketRepository.GetTicketByIdAsync(ticket.Id, cancellationToken);
        return TicketMapper.ToDetail(full!);
    }
}
