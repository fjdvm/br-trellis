namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.Constants;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Issues a chat conversation id for an authenticated customer starting a live-agent
/// chat session. Previously created a ticket in SentraCX; now the conversation is
/// created lazily in api-crms via the Tickets webhook when the first message is sent
/// through the chat hub. This endpoint just mints the conversation id the browser
/// uses to join the hub group.
/// </summary>
[Authorize(AuthenticationSchemes = AuthSchemes.Customer)]
[ApiController]
[Route("api/webhooks")]
public class SupportWebhookController : ControllerBase
{
    [HttpPost("support-ticket")]
    public ActionResult<SupportTicketResponseDto> CreateSupportTicket()
    {
        // Ensure the caller is an authenticated customer (identity is used by the
        // Handshake when messages are sent through the hub).
        _ = GetCurrentUserId();

        // Deterministic-enough unique conversation id for this chat session.
        var conversationId = Guid.NewGuid().ToString();
        return Ok(new SupportTicketResponseDto { TicketId = conversationId });
    }

    private Guid GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (subClaim == null || !Guid.TryParse(subClaim.Value, out var userId))
        {
            throw new UnauthorizedException("User ID claim is missing or invalid.");
        }
        return userId;
    }
}
