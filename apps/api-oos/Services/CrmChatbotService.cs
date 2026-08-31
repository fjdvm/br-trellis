namespace ApiOos.Services;

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

public class CrmChatbotService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<CrmChatbotService> logger) : ICrmChatbotService
{
    public Task<BotReplyResponseDto> GetBotReplyAsync(BotReplyRequestDto dto, string? customerId = null) =>
        ExecuteChatbotReplyAsync(dto.UserMessage, dto.TicketId, customerId);

    public Task<BotReplyResponseDto> GetPublicBotReplyAsync(string userMessage) =>
        ExecuteChatbotReplyAsync(userMessage, null, null);

    private async Task<BotReplyResponseDto> ExecuteChatbotReplyAsync(string message, string? ticketId, string? customerId)
    {
        try
        {
            var client = httpClientFactory.CreateClient("SentraCX");
            var token = configuration["CrmSync:ServiceToken"];
            if (!string.IsNullOrWhiteSpace(token))
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var body = new
            {
                message,
                ticketId = Guid.TryParse(ticketId, out var parsedTicketId) ? (Guid?)parsedTicketId : null,
                conversationHistory = Array.Empty<object>(),
                customerUserId = customerId
            };
            var response = await client.PostAsJsonAsync("/api/v1/integrations/oos/chatbot/reply", body);
            if (response.IsSuccessStatusCode)
                return await ToReplyAsync(response);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to call SentraCX CRM chatbot. Falling back to default assistant reply.");
        }

        return new BotReplyResponseDto
        {
            Reply = "Thank you for reaching out! How can I assist you further?",
            Category = "general_inquiry",
            ShouldEscalate = false,
        };
    }

    private static async Task<BotReplyResponseDto> ToReplyAsync(HttpResponseMessage response)
    {
        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var root = document.RootElement;
        return new BotReplyResponseDto
        {
            Reply = Text(root, "reply", ""),
            Category = Text(root, "intent", "general_inquiry"),
            ShouldEscalate = root.TryGetProperty("shouldEscalate", out var escalation) && escalation.GetBoolean(),
        };
    }

    private static string Text(JsonElement element, string property, string fallback) =>
        element.TryGetProperty(property, out var value) ? value.GetString() ?? fallback : fallback;
}
