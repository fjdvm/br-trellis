namespace ApiOos.Services;

using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ApiOos.DTOs.Webhooks;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Delivers ecommerce events to api-crms's Ecommerce webhook. Serializes the
/// envelope, signs the raw body with HMAC-SHA256 using the shared secret, and
/// POSTs it with an <c>X-Webhook-Signature: sha256=&lt;hex&gt;</c> header — the exact
/// delivery contract api-crms's <c>HmacSignatureValidator</c> expects. Uses the
/// named <c>ApiCrms</c> HttpClient.
/// </summary>
public sealed class EcommerceWebhookClient(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<EcommerceWebhookClient> logger) : IEcommerceWebhookClient
{
    public const string HttpClientName = "ApiCrms";
    private const string WebhookPath = "api/v1/webhooks/ecommerce";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = null, // PascalCase matches api-crms's case-insensitive binding
    };

    public async Task SendAsync(
        EcommerceWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
    {
        var body = JsonSerializer.Serialize(webhookEvent, JsonOptions);
        var secret = configuration["Ecommerce:WebhookSecret"] ?? string.Empty;

        var client = httpClientFactory.CreateClient(HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Post, WebhookPath)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json"),
        };
        request.Headers.TryAddWithoutValidation("X-Webhook-Signature", ComputeSignature(body, secret));

        var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "api-crms rejected {EventType} webhook {EventId}: {Status}",
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
