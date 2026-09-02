namespace ApiOos.Controllers;

using System.Text.Json.Serialization;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Receives Brevo's open/click event webhook (#164). api-oos owns the Brevo
/// account, so the callback lands here; each parsed event is relayed to api-crms
/// attributed to the originating Campaign (carried as a Brevo tag set at send time).
/// Unauthenticated (Brevo can't present a staff JWT); non-open/click events and
/// events without a resolvable campaign tag are ignored.
/// </summary>
[ApiController]
[Route("api/webhooks/brevo")]
[AllowAnonymous]
public sealed class BrevoWebhookController(
    ICampaignDispatchClient dispatchClient,
    ILogger<BrevoWebhookController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Receive(
        [FromBody] BrevoEvent payload,
        CancellationToken cancellationToken)
    {
        var eventType = MapEventType(payload.Event);
        if (eventType is null)
        {
            // Not an open/click (e.g. delivered, soft_bounce) — ignore.
            return Ok();
        }

        var campaignId = ResolveCampaignId(payload);
        if (campaignId is null)
        {
            logger.LogWarning("Brevo {Event} event had no resolvable campaign tag; ignoring.", payload.Event);
            return Ok();
        }

        var occurredAt = payload.Ts.HasValue
            ? DateTimeOffset.FromUnixTimeSeconds(payload.Ts.Value)
            : (DateTimeOffset?)null;

        await dispatchClient.ReportEventAsync(
            campaignId.Value,
            new CampaignEventReport(eventType, payload.Email ?? string.Empty, payload.Link, occurredAt),
            cancellationToken);

        return Ok();
    }

    private static string? MapEventType(string? brevoEvent) => brevoEvent?.ToLowerInvariant() switch
    {
        "opened" or "open" or "unique_opened" => "Open",
        "click" or "clicked" => "Click",
        _ => null,
    };

    private static Guid? ResolveCampaignId(BrevoEvent payload)
    {
        // Campaign id is carried in a Brevo tag we set at send time (or an
        // explicit campaignId field on the relayed payload).
        if (payload.CampaignId is { } explicitId && Guid.TryParse(explicitId, out var direct))
        {
            return direct;
        }
        if (payload.Tags is not null)
        {
            foreach (var tag in payload.Tags)
            {
                if (Guid.TryParse(tag, out var fromTag))
                {
                    return fromTag;
                }
            }
        }
        return null;
    }

    public sealed class BrevoEvent
    {
        [JsonPropertyName("event")]
        public string? Event { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("link")]
        public string? Link { get; set; }

        [JsonPropertyName("ts")]
        public long? Ts { get; set; }

        [JsonPropertyName("tags")]
        public List<string>? Tags { get; set; }

        [JsonPropertyName("campaignId")]
        public string? CampaignId { get; set; }
    }
}
