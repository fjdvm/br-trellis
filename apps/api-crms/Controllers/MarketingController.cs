using System.ComponentModel.DataAnnotations;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace api_crms.Controllers;

/// <summary>
/// api-crms's first genuine public-facing surface (ADR 0009): the unsubscribe link
/// embedded in every marketing Campaign email lands here, hit directly by real
/// recipients' mail clients over the open internet.
///
/// Hardened accordingly:
/// <list type="bullet">
/// <item>Rate limited (the <c>PublicUnsubscribe</c> policy) to blunt enumeration/abuse.</item>
/// <item>Input-validated: a malformed or missing email is silently ignored.</item>
/// <item>No information leakage: the same generic confirmation is returned whether or
/// not the email matched a Contact, so the endpoint can't be used to enumerate who is
/// in the CRM — matching the behavior of the api-oos version it replaces.</item>
/// </list>
/// Idempotent: unsubscribing an already-unsubscribed (or unknown) address still
/// returns the friendly confirmation.
/// </summary>
[ApiController]
[Route("api/marketing")]
[AllowAnonymous]
[EnableRateLimiting(UnsubscribeRateLimitPolicy)]
public sealed class MarketingController(IContactService contactService) : ControllerBase
{
    public const string UnsubscribeRateLimitPolicy = "PublicUnsubscribe";

    private const string ConfirmationHtml =
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\" />" +
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />" +
        "<title>Unsubscribed</title></head>" +
        "<body style=\"font-family:sans-serif;text-align:center;padding:48px;color:#1f2937;\">" +
        "<h2>You've been unsubscribed</h2>" +
        "<p>You will no longer receive marketing email from us.</p></body></html>";

    // The link recipients click. Always returns the same confirmation page.
    [HttpGet("unsubscribe")]
    public async Task<IActionResult> Unsubscribe(
        [FromQuery] string? email,
        CancellationToken cancellationToken)
    {
        await ApplyOptOutIfValidAsync(email, cancellationToken);
        return Content(ConfirmationHtml, "text/html");
    }

    // JSON variant for programmatic callers/tests. Same generic outcome regardless
    // of whether the email matched — 204 either way, no body to leak a signal.
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> UnsubscribePost(
        [FromBody] UnsubscribeRequest? request,
        CancellationToken cancellationToken)
    {
        await ApplyOptOutIfValidAsync(request?.Email, cancellationToken);
        return NoContent();
    }

    // Validates the email shape and applies the opt-out. A malformed/missing address
    // is silently ignored — the caller can't tell the difference, and we never throw
    // a validation error that would leak whether input was "accepted".
    private async Task ApplyOptOutIfValidAsync(string? email, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return;
        }

        var trimmed = email.Trim();
        // Guard against absurdly long input and obviously non-email strings before
        // touching the data store.
        if (trimmed.Length > 254 || !new EmailAddressAttribute().IsValid(trimmed))
        {
            return;
        }

        await contactService.SetMarketingOptOutByEmailAsync(trimmed, cancellationToken);
    }

    public sealed record UnsubscribeRequest(string? Email);
}
