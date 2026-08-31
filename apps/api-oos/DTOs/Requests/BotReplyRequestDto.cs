namespace ApiOos.DTOs.Requests;

public class BotReplyRequestDto
{
    public string TicketId { get; set; } = string.Empty;
    public string UserMessage { get; set; } = string.Empty;
}
