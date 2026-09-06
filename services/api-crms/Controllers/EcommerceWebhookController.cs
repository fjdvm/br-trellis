using System.Text.Json;
using api_crms.DTOs;
using api_crms.Helpers;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/webhooks/ecommerce")]
public sealed class EcommerceWebhookController(
    IEcommerceIngestionService ingestionService,
    IConfiguration configuration) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [HttpPost]
    public async Task<IActionResult> ReceiveWebhook(CancellationToken cancellationToken)
    {
        // Read raw body for signature validation
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync(cancellationToken);
        var bodyBytes = System.Text.Encoding.UTF8.GetBytes(rawBody);

        // Validate HMAC signature
        var signatureHeader = Request.Headers["X-Webhook-Signature"].FirstOrDefault();
        var secret = configuration["Ecommerce:WebhookSecret"] ?? string.Empty;

        if (!HmacSignatureValidator.IsValid(bodyBytes, signatureHeader, secret))
        {
            return Unauthorized("Invalid signature.");
        }

        // Deserialize and hand off
        var payload = JsonSerializer.Deserialize<EcommerceWebhookPayload>(rawBody, JsonOptions);
        if (payload is null)
        {
            return BadRequest("Invalid payload.");
        }

        var processed = await ingestionService.ProcessEventAsync(
            payload.EventId,
            payload.EventType,
            rawBody,
            cancellationToken);

        return processed ? Ok() : Ok(); // 200 even for dedup (acknowledge receipt)
    }
}
