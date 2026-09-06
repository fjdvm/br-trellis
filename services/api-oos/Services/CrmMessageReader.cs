namespace ApiOos.Services;

using System.Net;
using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Reads conversation messages from api-crms's
/// <c>GET api/v1/conversations/{conversationId}/messages?since=</c> endpoint over the
/// named <c>ApiCrms</c> HttpClient. This is the single outbound poll — api-crms never
/// initiates a call back to api-oos.
/// </summary>
public sealed class CrmMessageReader(
    IHttpClientFactory httpClientFactory,
    ILogger<CrmMessageReader> logger) : ICrmMessageReader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<IReadOnlyList<CrmMessage>> GetMessagesSinceAsync(
        string conversationId, DateTimeOffset? since, CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        var path = $"api/v1/conversations/{Uri.EscapeDataString(conversationId)}/messages";
        if (since is not null)
        {
            path += $"?since={Uri.EscapeDataString(since.Value.ToString("O"))}";
        }

        try
        {
            using var response = await client.GetAsync(path, cancellationToken);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return []; // Conversation not yet created in api-crms.
            }
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Polling api-crms for {ConversationId} returned {Status}",
                    conversationId, (int)response.StatusCode);
                return [];
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var messages = await JsonSerializer.DeserializeAsync<List<CrmMessageResponse>>(
                stream, JsonOptions, cancellationToken);
            return (messages ?? [])
                .Select(m => new CrmMessage
                {
                    Id = m.Id.ToString(),
                    SenderType = m.SenderType ?? string.Empty,
                    SenderStaffName = m.SenderStaffName,
                    Content = m.Content ?? string.Empty,
                    SentAt = m.SentAt,
                })
                .ToList();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to poll api-crms for {ConversationId}", conversationId);
            return [];
        }
    }

    private sealed class CrmMessageResponse
    {
        public Guid Id { get; init; }
        public string? SenderType { get; init; }
        public string? SenderStaffName { get; init; }
        public string? Content { get; init; }
        public DateTimeOffset SentAt { get; init; }
    }
}
