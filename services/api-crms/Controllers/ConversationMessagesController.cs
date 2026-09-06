using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

/// <summary>
/// Read endpoint for shop-chat conversation messages, keyed by the external
/// conversation id (the id api-oos knows). api-oos's staff-reply polling loop calls
/// <c>GET api/v1/conversations/{conversationId}/messages?since=</c> on an interval;
/// api-crms only ever serves the read — it never calls out (ADR 0002).
/// </summary>
[ApiController]
[Route("api/v1/conversations/{conversationId}/messages")]
public sealed class ConversationMessagesController(IMessageService messageService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MessageDto>>> ListSince(
        string conversationId,
        CancellationToken cancellationToken,
        [FromQuery] DateTimeOffset? since = null)
    {
        var messages = await messageService.ListMessagesByConversationSinceAsync(
            conversationId, since, cancellationToken);
        return messages is null ? NotFound() : Ok(messages);
    }
}
