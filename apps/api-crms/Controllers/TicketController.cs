using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/tickets")]
public sealed class TicketController(ITicketService ticketService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TicketListItemDto>>> ListTickets(
        [FromQuery] string? status = null,
        [FromQuery] string? waitingOn = null,
        [FromQuery] string? source = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await ticketService.ListTicketsAsync(status, waitingOn, source, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDetailDto>> GetTicket(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ticket = await ticketService.GetTicketByIdAsync(id, cancellationToken);
        return ticket is null ? NotFound() : Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDetailDto>> CreateTicket(
        CreateTicketDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var ticket = await ticketService.CreateTicketAsync(input, cancellationToken);
            return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/claim")]
    public async Task<ActionResult<TicketDetailDto>> ClaimTicket(
        Guid id,
        ClaimTicketDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            // Identity must come from the server-validated bearer token, not the
            // client. The browser session (NextAuth) can carry a mangled/rotating
            // id; the access token's `sub` is the stable, authoritative user id
            // (verified by JWT validation). Prefer it over the client-supplied
            // StaffId so a claimed ticket's AssignedToId always equals the id the
            // ownership filters compare against on later requests — the same
            // "trust the token, not the client" rule SentraCX's TicketsController
            // uses. Fall back to the request body only when unauthenticated.
            var tokenUserId = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                              ?? User?.FindFirst("sub")?.Value;

            var tokenName = User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                            ?? User?.FindFirst("name")?.Value;
            var tokenEmail = User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                             ?? User?.FindFirst("email")?.Value;

            var effectiveInput = string.IsNullOrWhiteSpace(tokenUserId)
                ? input
                : input with
                {
                    StaffId = tokenUserId,
                    StaffName = string.IsNullOrWhiteSpace(tokenName) ? input.StaffName : tokenName,
                    StaffEmail = string.IsNullOrWhiteSpace(tokenEmail) ? input.StaffEmail : tokenEmail,
                };

            var ticket = await ticketService.ClaimTicketAsync(id, effectiveInput, cancellationToken);
            return ticket is null ? NotFound() : Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/unclaim")]
    public async Task<ActionResult<TicketDetailDto>> UnclaimTicket(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            var ticket = await ticketService.UnclaimTicketAsync(id, cancellationToken, CurrentUserId());
            return ticket is null ? NotFound() : Ok(ticket);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult<TicketDetailDto>> ChangeStatus(
        Guid id,
        ChangeTicketStatusDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var ticket = await ticketService.ChangeStatusAsync(
                id, input, cancellationToken, CurrentUserId(), CurrentActorLabel());
            return ticket is null ? NotFound() : Ok(ticket);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/waiting-on")]
    public async Task<ActionResult<TicketDetailDto>> SetWaitingOn(
        Guid id,
        SetWaitingOnDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var ticket = await ticketService.SetWaitingOnAsync(id, input, cancellationToken, CurrentUserId());
            return ticket is null ? NotFound() : Ok(ticket);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// The authenticated caller's stable user id (OIDC subject) from the
    /// validated bearer token, or null when unauthenticated. Used to enforce
    /// that only a claimed ticket's owner can modify it.
    /// </summary>
    private string? CurrentUserId() =>
        User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User?.FindFirst("sub")?.Value;

    /// <summary>
    /// A human-readable attribution for the acting staff member, composed from the
    /// validated bearer token as "{Role} {Name}" (e.g. "Super Admin Alice"), falling
    /// back to just the name, then null when unauthenticated. Used to record who
    /// cancelled a ticket for display in the CRMS.
    /// </summary>
    private string? CurrentActorLabel()
    {
        var name = User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                   ?? User?.FindFirst("name")?.Value;

        var role = User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                   ?? User?.FindFirst("role")?.Value;

        if (string.IsNullOrWhiteSpace(name))
        {
            return string.IsNullOrWhiteSpace(role) ? null : role.Trim();
        }

        return string.IsNullOrWhiteSpace(role) ? name.Trim() : $"{role.Trim()} {name.Trim()}";
    }
}
