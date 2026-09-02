namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.Constants;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Issues a chat conversation id for an authenticated customer starting a live-agent
/// chat session. The conversation is created lazily in api-crms via the Tickets webhook
/// when the first message is sent through the chat hub; this endpoint mints the
/// conversation key the browser uses to join the hub group and to send that first
/// message. Per ADR 0006 (Option 1) that key is a Guid, and api-crms ingestion adopts
/// it as the new Ticket's own id — so this single key is the CRM Ticket id end to end,
/// with no throwaway conversationId and no response from api-crms.
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

        // The conversation key is a Guid; api-crms ingestion adopts it as the Ticket's
        // own id (ADR 0006 Option 1), so this is the canonical Ticket id — not a
        // throwaway conversationId. api-oos knows it up front, with no api-crms reply.
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
