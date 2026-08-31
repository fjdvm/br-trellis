namespace ApiOos.Services;

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ApiOos.DTOs.Webhooks;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Delivers shop-chat Ticket/Message events to api-crms's Tickets webhook. Signs the
/// raw body with HMAC-SHA256 (<c>X-Webhook-Signature: sha256=&lt;hex&gt;</c>) using the
/// shared <c>Tickets:WebhookSecret</c> — the contract api-crms's HmacSignatureValidator
/// expects. Reuses the named <c>ApiCrms</c> HttpClient.
/// </summary>
public sealed class TicketWebhookClient(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<TicketWebhookClient> logger) : ITicketWebhookClient
{
    private const string WebhookPath = "api/v1/webhooks/tickets";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = null, // PascalCase matches api-crms's case-insensitive binding
    };

    public async Task SendAsync(
        TicketWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
    {
        var body = JsonSerializer.Serialize(webhookEvent, JsonOptions);
        var secret = configuration["Tickets:WebhookSecret"] ?? string.Empty;

        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Post, WebhookPath)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
        request.Headers.TryAddWithoutValidation("X-Webhook-Signature", ComputeSignature(body, secret));

        var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "api-crms rejected {EventType} ticket webhook {EventId}: {Status}",
                webhookEvent.EventType, webhookEvent.EventId, (int)response.StatusCode);
        }
    }

    private static string ComputeSignature(string body, string secret)
    {
        var hash = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body));
        return "sha256=" + Convert.ToHexStringLower(hash);
    }
}
