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
    private readonly ISupportTicketReader _supportTicketReader;
    private readonly ApiOos.Interfaces.Repositories.IUserRepository _userRepository;

    public SupportController(
        ISupportTicketService supportTicketService,
        ISupportTicketReader supportTicketReader,
        ApiOos.Interfaces.Repositories.IUserRepository userRepository)
    {
        _supportTicketService = supportTicketService;
        _supportTicketReader = supportTicketReader;
        _userRepository = userRepository;
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

    /// <summary>
    /// Lists the signed-in shopper's support tickets, read back from api-crms and
    /// filtered to their account email. Powers the web-shop support/profile tickets
    /// table so a submitted ticket shows up there.
    /// </summary>
    [HttpGet("tickets")]
    public async Task<ActionResult<IReadOnlyList<ShopperTicketDto>>> ListTickets(
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            return Ok(Array.Empty<ShopperTicketDto>());
        }

        var tickets = await _supportTicketReader.GetTicketsByEmailAsync(user.Email, cancellationToken);

        var dtos = tickets.Select(t => new ShopperTicketDto
        {
            Id = t.Id,
            Title = t.Title,
            Description = t.Description ?? string.Empty,
            Status = t.Status,
            CustomerId = userId.ToString(),
            AssignedToName = t.AssignedToName,
            CreatedAt = t.CreatedAt.ToString("O"),
            UpdatedAt = t.UpdatedAt.ToString("O"),
        }).ToList();

        return Ok(dtos);
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
