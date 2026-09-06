namespace ApiOos.DTOs.Responses;

/// <summary>
/// A support ticket returned to the web-shop profile/support page. Shape matches the
/// web-shop's TicketSummary so the tickets table can render it directly.
/// </summary>
public sealed class ShopperTicketDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }

    /// <summary>
    /// True once Staff has authored at least one Message on the ticket. web-shop hides
    /// the "Message Staff" link until this is true (#145).
    /// </summary>
    public bool HasStaffReplied { get; set; }

    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}
