using System.Text;
using System.Text.Json;
using api_crms.DTOs;
using api_crms.Helpers;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/webhooks/email")]
public sealed class EmailWebhookController(
    IEmailIngestionService ingestionService,
    IConfiguration configuration) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    [HttpPost]
    public async Task<IActionResult> ReceiveWebhook(CancellationToken cancellationToken)
    {
        // Read raw body for signature validation.
        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync(cancellationToken);
        var bodyBytes = Encoding.UTF8.GetBytes(rawBody);

        // Validate HMAC signature (same contract as the Ecommerce webhook, ADR 0001).
        var signatureHeader = Request.Headers["X-Webhook-Signature"].FirstOrDefault();
        var secret = configuration["Email:WebhookSecret"] ?? string.Empty;

        if (!HmacSignatureValidator.IsValid(bodyBytes, signatureHeader, secret))
        {
            return Unauthorized("Invalid signature.");
        }

        var payload = JsonSerializer.Deserialize<EmailWebhookPayload>(rawBody, JsonOptions);
        if (payload is null)
        {
            return BadRequest("Invalid payload.");
        }

        await ingestionService.ProcessEventAsync(
            payload.EventId,
            payload.EventType,
            rawBody,
            cancellationToken);

        // 200 even for dedup (acknowledge receipt) — at-least-once delivery.
        return Ok();
    }
}
