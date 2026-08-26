using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/segments")]
public sealed class SegmentController(ISegmentService segmentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SegmentDto>>> ListSegments(
        CancellationToken cancellationToken)
    {
        return Ok(await segmentService.ListSegmentsAsync(cancellationToken));
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<IReadOnlyList<SegmentMemberDto>>> GetSegmentMembers(
        Guid id,
        CancellationToken cancellationToken)
    {
        var members = await segmentService.GetSegmentMembersAsync(id, cancellationToken);
        if (members is null)
        {
            return NotFound();
        }
        return Ok(members);
    }
}
