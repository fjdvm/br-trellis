using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/tickets/{ticketId:guid}/messages")]
public sealed class MessageController(IMessageService messageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> ListMessages(
        Guid ticketId,
        CancellationToken cancellationToken)
    {
        var messages = await messageService.ListMessagesAsync(ticketId, cancellationToken);
        return messages is null ? NotFound() : Ok(messages);
    }

    [HttpPost]
    public async Task<ActionResult<MessageDto>> PostMessage(
        Guid ticketId,
        PostMessageDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var message = await messageService.PostMessageAsync(ticketId, input, cancellationToken);
            return message is null
                ? NotFound()
                : CreatedAtAction(nameof(ListMessages), new { ticketId }, message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
