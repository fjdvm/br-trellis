namespace ApiOos.Controllers;

using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Public, unauthenticated marketing endpoints. The unsubscribe link embedded in
/// Campaign emails lands here; api-oos relays the opt-out to api-crms (which owns
/// the Contact record). Idempotent — always returns a friendly confirmation.
/// </summary>
[ApiController]
[Route("api/marketing")]
[AllowAnonymous]
public sealed class MarketingController(ICampaignDispatchClient dispatchClient) : ControllerBase
{
    [HttpGet("unsubscribe")]
    public async Task<IActionResult> Unsubscribe(
        [FromQuery] string email,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            await dispatchClient.ReportOptOutAsync(email, cancellationToken);
        }

        return Content(
            "<html><body style=\"font-family:sans-serif;text-align:center;padding:48px;\">" +
            "<h2>You've been unsubscribed</h2>" +
            "<p>You will no longer receive marketing email from us.</p></body></html>",
            "text/html");
    }

    // JSON variant for programmatic callers/tests.
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> UnsubscribePost(
        [FromBody] UnsubscribeRequest request,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request?.Email))
        {
            await dispatchClient.ReportOptOutAsync(request!.Email, cancellationToken);
        }
        return NoContent();
    }

    public sealed record UnsubscribeRequest(string Email);
}
