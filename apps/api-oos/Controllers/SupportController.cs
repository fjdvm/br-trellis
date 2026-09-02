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
    private readonly ICustomerTicketDetailReader _customerTicketDetailReader;

    public SupportController(
        ISupportTicketService supportTicketService,
        ISupportTicketReader supportTicketReader,
        ApiOos.Interfaces.Repositories.IUserRepository userRepository,
        ICustomerTicketDetailReader customerTicketDetailReader)
    {
        _supportTicketService = supportTicketService;
        _supportTicketReader = supportTicketReader;
        _userRepository = userRepository;
        _customerTicketDetailReader = customerTicketDetailReader;
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
            HasStaffReplied = t.HasStaffReplied,
            CreatedAt = t.CreatedAt.ToString("O"),
            UpdatedAt = t.UpdatedAt.ToString("O"),
        }).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// Returns a single Conversation to its owning Contact, verifying ownership
    /// server-side before any Conversation data is handed back (ADR 0005). A Ticket
    /// that doesn't exist and a Ticket that exists but isn't the caller's both return
    /// an identical 404 — so ids can't be enumerated by probing. The owner receives the
    /// ticket subject/status plus the full, chronological message history.
    /// </summary>
    [HttpGet("tickets/{id}")]
    public async Task<ActionResult<ConversationDetailDto>> GetConversation(
        string id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || string.IsNullOrWhiteSpace(user.Email))
        {
            // No resolvable email → fail closed as an indistinguishable 404.
            return NotFound();
        }

        var detail = await _customerTicketDetailReader.GetTicketDetailForCustomerAsync(
            id, user.Email, cancellationToken);

        switch (detail.Access)
        {
            case CustomerTicketAccess.Open:
                return Ok(new ConversationDetailDto
                {
                    Id = detail.TicketId ?? id,
                    Subject = detail.Subject ?? string.Empty,
                    Status = detail.Status ?? string.Empty,
                    State = "open",
                    Messages = detail.Messages.Select(m => new ConversationMessageDto
                    {
                        Id = m.Id,
                        SenderType = m.SenderType,
                        SenderStaffName = m.SenderStaffName,
                        Content = m.Content,
                        SentAt = m.SentAt.ToString("O"),
                    }).ToList(),
                });

            case CustomerTicketAccess.AwaitingStaffReply:
                // Owner, but Staff hasn't replied yet: return subject/status only, with
                // NO message data — the waiting state must not leak the thread (#145).
                return Ok(new ConversationDetailDto
                {
                    Id = detail.TicketId ?? id,
                    Subject = detail.Subject ?? string.Empty,
                    Status = detail.Status ?? string.Empty,
                    State = "awaiting-staff-reply",
                    Messages = [],
                });

            // NotFound and NotOwner deliberately collapse to the identical response.
            case CustomerTicketAccess.NotFound:
            case CustomerTicketAccess.NotOwner:
            default:
                return NotFound();
        }
    }

    /// <summary>
    /// Cancels the signed-in customer's own support ticket. Ownership is verified
    /// server-side before anything is relayed (ADR 0005): a ticket the caller doesn't
    /// own and one that doesn't exist both return an identical 404, so ids can't be
    /// enumerated by probing. On success the cancellation is relayed to api-crms via the
    /// Tickets webhook, which flips the ticket to Canceled and pushes the status change
    /// to web-crms in real time. api-oos stores no ticket state of its own.
    /// </summary>
    [HttpDelete("tickets/{id}")]
    public async Task<IActionResult> CancelTicket(
        string id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var canceled = await _supportTicketService.CancelAsync(userId, id, cancellationToken);
        return canceled ? NoContent() : NotFound();
    }

    private Guid GetCurrentUserId()    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (subClaim == null || !Guid.TryParse(subClaim.Value, out var userId))
        {
            throw new UnauthorizedException("User ID claim is missing or invalid.");
        }
        return userId;
    }
}
