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
}
