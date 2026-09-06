namespace ApiOos.DTOs.Requests;

public class BotReplyRequestDto
{
    public string TicketId { get; set; } = string.Empty;
    public string UserMessage { get; set; } = string.Empty;

    /// <summary>
    /// The Identity Handshake email. Required for the anonymous public bot endpoint —
    /// no fully-anonymous messaging, bot replies included.
    /// </summary>
    public string? CustomerEmail { get; set; }
}
