namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.Constants;
using ApiOos.DTOs.Requests.Support;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Shopper-submitted support tickets (the profile "Submit Ticket" dialog). Creates a
/// ticket in api-crms via the Tickets webhook — api-oos stores no tickets. Customer
/// authentication is required so the ticket is attributed to the right Contact.
/// </summary>
[Authorize(AuthenticationSchemes = AuthSchemes.Customer)]
[ApiController]
[Route("api/support")]
public class SupportController : ControllerBase
{
    private readonly ISupportTicketService _supportTicketService;

    public SupportController(ISupportTicketService supportTicketService)
    {
        _supportTicketService = supportTicketService;
    }

    [HttpPost("tickets")]
    public async Task<ActionResult<SupportTicketResponseDto>> CreateTicket(
        [FromBody] CreateSupportTicketRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _supportTicketService.CreateAsync(userId, request, cancellationToken);
        return Ok(result);
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
