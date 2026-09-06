namespace ApiOos.DTOs.Responses;

public class BotReplyResponseDto
{
    public string Reply { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool ShouldEscalate { get; set; }
}
