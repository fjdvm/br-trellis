using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

/// <summary>
/// Shared data-access query shapes for Tickets, so the ADR 0006 conversation-key
/// resolution rule lives in exactly one place rather than being re-expressed in every
/// repository that needs it.
/// </summary>
public static class TicketQueryExtensions
{
    /// <summary>
    /// Resolves a shop-chat conversation key to a Ticket (or null): match the stored
    /// <see cref="Ticket.ExternalThreadId"/> first, then, when the key is a well-formed
    /// Guid, the Ticket's own <see cref="Ticket.Id"/>. For a shop-chat Ticket the two
    /// are equal (ADR 0006), but a caller that only holds the ticket id must still
    /// resolve — this is the single definition of "resolve by either key".
    /// </summary>
    public static async Task<Ticket?> ResolveByConversationKeyAsync(
        this IQueryable<Ticket> tickets, string conversationKey, CancellationToken cancellationToken)
    {
        var byThread = await tickets
            .FirstOrDefaultAsync(t => t.ExternalThreadId == conversationKey, cancellationToken);
        if (byThread is not null)
        {
            return byThread;
        }

        return Guid.TryParse(conversationKey, out var ticketId)
            ? await tickets.FirstOrDefaultAsync(t => t.Id == ticketId, cancellationToken)
            : null;
    }
}
