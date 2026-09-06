using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/canned-replies")]
[Authorize]
public sealed class CannedReplyController(ICannedReplyService replyService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CannedReplyListItemDto>>> ListReplies(
        [FromQuery] bool includeArchived = false,
        [FromQuery] Guid? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        return Ok(await replyService.ListRepliesAsync(includeArchived, categoryId, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CannedReplyDetailDto>> GetReply(
        Guid id,
        CancellationToken cancellationToken)
    {
        var reply = await replyService.GetReplyByIdAsync(id, cancellationToken);
        return reply is null ? NotFound() : Ok(reply);
    }

    [HttpPost]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<ActionResult<CannedReplyDetailDto>> CreateReply(
        CreateCannedReplyDto input,
        CancellationToken cancellationToken)
    {
        var reply = await replyService.CreateReplyAsync(input, cancellationToken);
        return CreatedAtAction(nameof(GetReply), new { id = reply.Id }, reply);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<ActionResult<CannedReplyDetailDto>> UpdateReply(
        Guid id,
        UpdateCannedReplyDto input,
        CancellationToken cancellationToken)
    {
        var reply = await replyService.UpdateReplyAsync(id, input, cancellationToken);
        return reply is null ? NotFound() : Ok(reply);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<IActionResult> ArchiveReply(
        Guid id,
        CancellationToken cancellationToken)
    {
        var archived = await replyService.ArchiveReplyAsync(id, cancellationToken);
        return archived ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/restore")]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<ActionResult<CannedReplyDetailDto>> RestoreReply(
        Guid id,
        CancellationToken cancellationToken)
    {
        var reply = await replyService.RestoreReplyAsync(id, cancellationToken);
        return reply is null ? NotFound() : Ok(reply);
    }
}
