namespace ApiOos.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Services;

/// <summary>
/// Bot-phase chat stub. The SentraCX chatbot proxy has been removed — once the
/// Identity Handshake has passed, a bot-phase message immediately escalates to a live
/// agent via the chat hub / Tickets webhook path (#124) rather than generating a bot
/// reply. Real bot-reply generation (e.g. an LLM) is deferred to a future round.
/// </summary>
public sealed class CrmChatbotService : ICrmChatbotService
{
    private const string EscalationNotice =
        "Thanks for reaching out! Connecting you with a support agent now.";

    public Task<BotReplyResponseDto> GetBotReplyAsync(BotReplyRequestDto dto, string? customerId = null)
        => Task.FromResult(Escalate());

    public Task<BotReplyResponseDto> GetPublicBotReplyAsync(string userMessage)
        => Task.FromResult(Escalate());

    private static BotReplyResponseDto Escalate() => new()
    {
        Reply = EscalationNotice,
        Category = "escalation",
        ShouldEscalate = true,
    };
}
