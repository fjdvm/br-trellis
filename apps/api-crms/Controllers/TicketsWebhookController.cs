using System.Text;
using System.Text.Json;
using api_crms.DTOs;
using api_crms.Helpers;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

/// <summary>
/// Receives shop-chat Ticket/Message events (#122). Distinct from the Ecommerce and
/// Email webhooks, but shares the HMAC-signed, at-least-once, dedup-by-event-id
/// delivery contract (ADR 0001). api-crms only ever receives — it never calls out.
/// </summary>
[ApiController]
[Route("api/v1/webhooks/tickets")]
public sealed class TicketsWebhookController(
    ITicketIngestionService ingestionService,
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

        // Validate HMAC signature (same helper/contract as Ecommerce & Email).
        var signatureHeader = Request.Headers["X-Webhook-Signature"].FirstOrDefault();
        var secret = configuration["Tickets:WebhookSecret"] ?? string.Empty;

        if (!HmacSignatureValidator.IsValid(bodyBytes, signatureHeader, secret))
        {
            return Unauthorized("Invalid signature.");
        }

        var payload = JsonSerializer.Deserialize<TicketWebhookPayload>(rawBody, JsonOptions);
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
