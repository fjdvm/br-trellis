namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.DTOs.Responses;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/webhooks")]
public class SupportWebhookController : ControllerBase
{
    private readonly ISentraCxService _sentraCxService;
    private readonly IUserService _userService;

    public SupportWebhookController(ISentraCxService sentraCxService, IUserService userService)
    {
        _sentraCxService = sentraCxService;
        _userService = userService;
    }

    [HttpPost("support-ticket")]
    public async Task<ActionResult<SupportTicketResponseDto>> CreateSupportTicket()
    {
        var userId = GetCurrentUserId();
        var user = await _userService.GetMeAsync(userId);

        var ticketId = await _sentraCxService.CreateSupportTicketAsync(userId, user.FullName, user.Email);
        return Ok(new SupportTicketResponseDto { TicketId = ticketId });
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
