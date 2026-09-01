using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/tickets/{ticketId:guid}/messages")]
public sealed class MessageController(IMessageService messageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> ListMessages(
        Guid ticketId,
        CancellationToken cancellationToken,
        [FromQuery] DateTimeOffset? since = null)
    {
        var messages = since is null
            ? await messageService.ListMessagesAsync(ticketId, cancellationToken)
            : await messageService.ListMessagesSinceAsync(ticketId, since, cancellationToken);
        return messages is null ? NotFound() : Ok(messages);
    }

    [HttpPost]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
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
