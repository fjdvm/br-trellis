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
        string? source,
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

        TicketSource? sourceFilter = null;
        if (!string.IsNullOrWhiteSpace(source))
        {
            if (!Enum.TryParse<TicketSource>(source, ignoreCase: true, out var parsedSource))
            {
                throw new ArgumentException($"Invalid Source: '{source}'.");
            }
            sourceFilter = parsedSource;
        }

        var tickets = await ticketRepository.ListTicketsAsync(
            statusFilter, waitingOnFilter, sourceFilter, cancellationToken);
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

        // Normalize the optional contact link. A blank/omitted value means
        // "no contact" (a valid, unlinked ticket). A non-blank value must be a
        // well-formed Guid — reject anything else with a clear message rather
        // than letting a malformed id fall through as "no contact".
        Guid? contactId = null;
        if (!string.IsNullOrWhiteSpace(input.ContactId))
        {
            if (!Guid.TryParse(input.ContactId.Trim(), out var parsedContactId))
            {
                throw new ArgumentException("ContactId must be a valid identifier.");
            }
            contactId = parsedContactId;
        }

        if (contactId.HasValue
            && !await ticketRepository.ContactExistsAsync(contactId.Value, cancellationToken))
        {
            throw new ArgumentException("Contact does not exist.");
        }

        var now = DateTimeOffset.UtcNow;
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            ContactId = contactId,
            Subject = input.Subject.Trim(),
            Status = TicketStatus.Unclaimed,
            WaitingOn = WaitingOn.None,
            Source = TicketSource.Manual,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await ticketRepository.AddTicketAsync(ticket, cancellationToken);

        var full = await ticketRepository.GetTicketByIdAsync(ticket.Id, cancellationToken);
        return TicketMapper.ToDetail(full!);
    }

    public async Task<TicketDetailDto?> ClaimTicketAsync(
        Guid id,
        ClaimTicketDto input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.StaffId))
        {
            throw new ArgumentException("Staff identity is required to claim a ticket.");
        }

        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        var claimable = ticket.Status == TicketStatus.Unclaimed
            || (ticket.Status == TicketStatus.Ongoing && ticket.AssignedToId is null);
        if (!claimable)
        {
            throw new InvalidOperationException(
                $"Ticket cannot be claimed from status '{ticket.Status}'"
                + (ticket.AssignedToId is not null ? " while assigned to another agent." : "."));
        }

        ticket.AssignedToId = input.StaffId.Trim();
        ticket.AssignedToName = input.StaffName?.Trim();
        ticket.AssignedToEmail = input.StaffEmail?.Trim().ToLowerInvariant();
        ticket.Status = TicketStatus.Claimed;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await ticketRepository.GetTicketByIdAsync(id, cancellationToken);
        return TicketMapper.ToDetail(full!);
    }

    public async Task<TicketDetailDto?> UnclaimTicketAsync(
        Guid id,
        CancellationToken cancellationToken,
        string? callerId = null)
    {
        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        EnsureCallerMayModify(ticket, callerId);

        if (ticket.Status is not (TicketStatus.Claimed or TicketStatus.Ongoing))
        {
            throw new InvalidOperationException(
                $"Ticket cannot be unclaimed from status '{ticket.Status}'.");
        }

        ticket.AssignedToId = null;
        ticket.AssignedToName = null;
        ticket.AssignedToEmail = null;
        ticket.Status = TicketStatus.Unclaimed;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await ticketRepository.GetTicketByIdAsync(id, cancellationToken);
        return TicketMapper.ToDetail(full!);
    }

    public async Task<TicketDetailDto?> ChangeStatusAsync(
        Guid id,
        ChangeTicketStatusDto input,
        CancellationToken cancellationToken,
        string? callerId = null)
    {
        if (!Enum.TryParse<TicketStatus>(input.Status, ignoreCase: true, out var target))
        {
            throw new ArgumentException($"Invalid Status: '{input.Status}'.");
        }

        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        EnsureCallerMayModify(ticket, callerId);

        if (!IsValidTransition(ticket.Status, target))
        {
            throw new InvalidOperationException(
                $"Invalid status transition: '{ticket.Status}' → '{target}'.");
        }

        ticket.Status = target;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await ticketRepository.GetTicketByIdAsync(id, cancellationToken);
        return TicketMapper.ToDetail(full!);
    }

    public async Task<TicketDetailDto?> SetWaitingOnAsync(
        Guid id,
        SetWaitingOnDto input,
        CancellationToken cancellationToken,
        string? callerId = null)
    {
        if (!Enum.TryParse<WaitingOn>(input.WaitingOn, ignoreCase: true, out var target))
        {
            throw new ArgumentException($"Invalid WaitingOn: '{input.WaitingOn}'.");
        }

        var ticket = await dbContext.Tickets.FindAsync([id], cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        EnsureCallerMayModify(ticket, callerId);

        // WaitingOn is fully independent of Status/AssignedTo* — set it and nothing else.
        ticket.WaitingOn = target;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await ticketRepository.GetTicketByIdAsync(id, cancellationToken);
        return TicketMapper.ToDetail(full!);
    }

    /// <summary>
    /// Enforce that only a claimed ticket's owner may modify it. When a
    /// <paramref name="callerId"/> is supplied (an authenticated request) and
    /// the ticket is assigned to a different agent, the modification is
    /// rejected. Unowned tickets, and calls without a caller identity (internal
    /// callers/unit tests), are unaffected.
    /// </summary>
    private static void EnsureCallerMayModify(Ticket ticket, string? callerId)
    {
        if (string.IsNullOrWhiteSpace(callerId)) return;      // no caller identity → skip
        if (string.IsNullOrWhiteSpace(ticket.AssignedToId)) return; // unowned → anyone may act
        if (!string.Equals(ticket.AssignedToId, callerId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException(
                "Only the agent who owns this ticket can modify it.");
        }
    }

    private static bool IsValidTransition(TicketStatus from, TicketStatus to)
    {
        // Completed and Canceled are terminal.
        return (from, to) switch
        {
            (TicketStatus.Unclaimed, TicketStatus.Claimed) => true,
            (TicketStatus.Claimed, TicketStatus.Ongoing) => true,
            (TicketStatus.Ongoing, TicketStatus.Completed) => true,
            (TicketStatus.Unclaimed, TicketStatus.Canceled) => true,
            (TicketStatus.Claimed, TicketStatus.Canceled) => true,
            (TicketStatus.Ongoing, TicketStatus.Canceled) => true,
            _ => false,
        };
    }
}
