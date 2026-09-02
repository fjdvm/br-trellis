namespace ApiOos.Interfaces.Services;

/// <summary>
/// The outcomes of resolving a Ticket-by-id for a specific customer, before any
/// Conversation data is handed back to web-shop. This is the single source of truth
/// for the security decision — ownership is verified here, server-side, not in the
/// page (ADR 0005). Ownership splits further into whether Staff has replied yet (#145).
/// </summary>
public enum CustomerTicketAccess
{
    /// <summary>No Ticket exists with the requested id in api-crms.</summary>
    NotFound,

    /// <summary>
    /// A Ticket exists but its Contact email does not match the requesting customer
    /// (case-insensitively), or the Ticket's Contact has no email on file. Deliberately
    /// indistinguishable from <see cref="NotFound"/> at the API boundary so Ticket ids
    /// can't be enumerated by probing.
    /// </summary>
    NotOwner,

    /// <summary>
    /// The requesting customer owns the Ticket, but no Staff-authored Message exists on
    /// it yet — the Conversation stays closed to its own Contact (a "waiting" state),
    /// independent of the Ticket's Status. No message history is returned (#145).
    /// </summary>
    AwaitingStaffReply,

    /// <summary>
    /// The requesting customer owns the Ticket and at least one Staff-authored Message
    /// exists — the Conversation is open; its full history may be returned (#145).
    /// </summary>
    Open,
}

/// <summary>
/// A single Message on a Conversation, as seen by its owning customer.
/// </summary>
public sealed class CustomerTicketMessage
{
    public required string Id { get; init; }

    /// <summary>"Contact" or "Staff" (as api-crms serialises MessageSenderType).</summary>
    public required string SenderType { get; init; }

    public string? SenderStaffName { get; init; }
    public required string Content { get; init; }
    public required DateTimeOffset SentAt { get; init; }
}

/// <summary>
/// The result of <see cref="ICustomerTicketDetailReader.GetTicketDetailForCustomerAsync"/>.
/// Message history is only populated on <see cref="CustomerTicketAccess.Open"/>;
/// <see cref="CustomerTicketAccess.AwaitingStaffReply"/> carries the ticket
/// subject/status only, and the two non-owner outcomes carry nothing.
/// </summary>
public sealed class CustomerTicketDetail
{
    public required CustomerTicketAccess Access { get; init; }

    public string? TicketId { get; init; }
    public string? Subject { get; init; }
    public string? Status { get; init; }

    /// <summary>Full message history, chronological (oldest-first). Empty unless Open.</summary>
    public IReadOnlyList<CustomerTicketMessage> Messages { get; init; } = [];

    public static CustomerTicketDetail NotFound { get; } =
        new() { Access = CustomerTicketAccess.NotFound };

    public static CustomerTicketDetail NotOwner { get; } =
        new() { Access = CustomerTicketAccess.NotOwner };

    /// <summary>
    /// Owner, but no Staff reply yet — waiting state. Ticket subject/status only; no
    /// message data is returned to the client.
    /// </summary>
    public static CustomerTicketDetail AwaitingStaffReply(
        string ticketId, string subject, string status) =>
        new()
        {
            Access = CustomerTicketAccess.AwaitingStaffReply,
            TicketId = ticketId,
            Subject = subject,
            Status = status,
        };

    /// <summary>Owner with at least one Staff reply — full history returned.</summary>
    public static CustomerTicketDetail Open(
        string ticketId, string subject, string status, IReadOnlyList<CustomerTicketMessage> messages) =>
        new()
        {
            Access = CustomerTicketAccess.Open,
            TicketId = ticketId,
            Subject = subject,
            Status = status,
            Messages = messages,
        };
}

/// <summary>
/// Resolves a single Ticket by id for a specific signed-in customer, verifying
/// ownership before returning any Conversation data. Reaches into api-crms
/// server-to-server (the same boundary <see cref="ISupportTicketReader"/> uses for
/// listing) — web-shop never talks to api-crms directly (ADR 0004/0005).
/// </summary>
public interface ICustomerTicketDetailReader
{
    /// <summary>
    /// Resolves <paramref name="ticketId"/> for the customer identified by
    /// <paramref name="requestingEmail"/> into one of <see cref="CustomerTicketAccess"/>.
    /// Ownership is a case-insensitive email match; a Ticket whose Contact has no email
    /// can never match. Messages (when owner) are returned oldest-first.
    /// </summary>
    Task<CustomerTicketDetail> GetTicketDetailForCustomerAsync(
        string ticketId, string requestingEmail, CancellationToken cancellationToken = default);
}
