namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.Constants;
using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize(AuthenticationSchemes = AuthSchemes.Customer)]
[ApiController]
[Route("api/bot")]
public class BotController : ControllerBase
{
    private readonly ICrmChatbotService _chatbotService;

    public BotController(ICrmChatbotService chatbotService)
    {
        _chatbotService = chatbotService;
    }

    [HttpPost("reply")]
    public async Task<ActionResult<BotReplyResponseDto>> GetReply([FromBody] BotReplyRequestDto dto)
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        var customerId = subClaim?.Value;

        var reply = await _chatbotService.GetBotReplyAsync(dto, customerId);
        return Ok(reply);
    }

    [AllowAnonymous]
    [HttpPost("public-reply")]
    public async Task<ActionResult<BotReplyResponseDto>> GetPublicReply([FromBody] BotReplyRequestDto dto)
    {
        // Identity Handshake gate: an anonymous visitor must have supplied an email
        // before any bot reply — no fully-anonymous messaging (user story 29).
        if (string.IsNullOrWhiteSpace(dto.CustomerEmail))
        {
            return BadRequest("An email (Identity Handshake) is required before chatting.");
        }

        var reply = await _chatbotService.GetPublicBotReplyAsync(dto.UserMessage);
        return Ok(reply);
    }
}
