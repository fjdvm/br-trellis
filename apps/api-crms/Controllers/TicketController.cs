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
        CancellationToken cancellationToken = default)
    {
        try
        {
            return Ok(await ticketService.ListTicketsAsync(status, waitingOn, cancellationToken));
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
            var ticket = await ticketService.ClaimTicketAsync(id, input, cancellationToken);
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
            var ticket = await ticketService.UnclaimTicketAsync(id, cancellationToken);
            return ticket is null ? NotFound() : Ok(ticket);
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
            var ticket = await ticketService.ChangeStatusAsync(id, input, cancellationToken);
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

    [HttpPost("{id:guid}/waiting-on")]
    public async Task<ActionResult<TicketDetailDto>> SetWaitingOn(
        Guid id,
        SetWaitingOnDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var ticket = await ticketService.SetWaitingOnAsync(id, input, cancellationToken);
            return ticket is null ? NotFound() : Ok(ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
