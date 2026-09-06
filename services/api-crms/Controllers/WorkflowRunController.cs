using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/workflow-runs")]
[Authorize(Policy = CrmPermissionPolicies.AutomationCanRead)]
public sealed class WorkflowRunController(
    IWorkflowRunQueryService workflowRunQueryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WorkflowRunListItemDto>>> ListWorkflowRuns(
        [FromQuery] Guid? entityId,
        CancellationToken cancellationToken)
    {
        return Ok(await workflowRunQueryService.ListWorkflowRunsAsync(entityId, cancellationToken));
    }
}
