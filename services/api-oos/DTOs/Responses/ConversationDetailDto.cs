namespace ApiOos.DTOs.Responses;

/// <summary>
/// A single Message in a Conversation, returned to the owning customer's web-shop
/// Conversation view. Chronological order is guaranteed by the caller.
/// </summary>
public sealed class ConversationMessageDto
{
    public string Id { get; set; } = string.Empty;

    /// <summary>"Contact" or "Staff".</summary>
    public string SenderType { get; set; } = string.Empty;

    public string? SenderStaffName { get; set; }
    public string Content { get; set; } = string.Empty;
    public string SentAt { get; set; } = string.Empty;
}

/// <summary>
/// An owner-verified Conversation returned to web-shop's Server Component. Only ever
/// produced for the Contact who owns the Ticket (verified server-side; ADR 0005) —
/// NotFound/NotOwner map to an identical 404 at the controller and never reach this
/// shape. <see cref="State"/> distinguishes the staff-reply gate outcome (#145):
/// "awaiting-staff-reply" carries no messages, "open" carries the full history.
/// </summary>
public sealed class ConversationDetailDto
{
    public string Id { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    /// <summary>"awaiting-staff-reply" or "open".</summary>
    public string State { get; set; } = string.Empty;

    public IReadOnlyList<ConversationMessageDto> Messages { get; set; } = [];
}
