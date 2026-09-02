namespace ApiOos.Interfaces.Services;

/// <summary>
/// A support ticket as seen by the shopper who opened it, read back from api-crms.
/// api-oos owns no ticket storage; this is a projection of api-crms's ticket list
/// filtered to the signed-in customer.
/// </summary>
public sealed class ShopperTicket
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required string Status { get; init; }
    public string? AssignedToName { get; init; }

    /// <summary>
    /// True once at least one Staff-authored Message exists on the ticket. Drives the
    /// customer-facing "Message Staff" affordance, which stays hidden until Staff has
    /// replied — independent of Status (#145, CONTEXT.md Conversation).
    /// </summary>
    public bool HasStaffReplied { get; init; }

    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}

/// <summary>
/// Reads a shopper's support tickets back from api-crms (the system of record),
/// filtered to the tickets whose Contact matches the shopper's email. The only
/// outbound direction is api-oos → api-crms (ADR 0002).
/// </summary>
public interface ISupportTicketReader
{
    /// <summary>
    /// Lists tickets opened by the customer with <paramref name="customerEmail"/>,
    /// newest-first. Returns an empty list on any api-crms error (best-effort read).
    /// </summary>
    Task<IReadOnlyList<ShopperTicket>> GetTicketsByEmailAsync(
        string customerEmail, CancellationToken cancellationToken = default);
}
