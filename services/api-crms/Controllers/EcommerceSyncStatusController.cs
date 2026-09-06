using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/ecommerce/sync-status")]
[Authorize(Policy = CrmPermissionPolicies.EcommerceCanRead)]
public sealed class EcommerceSyncStatusController(
    IEcommerceSyncStatusService syncStatusService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<EcommerceSyncStatusDto>> GetSyncStatus(
        CancellationToken cancellationToken)
    {
        var result = await syncStatusService.GetSyncStatusAsync(cancellationToken);
        return Ok(result);
    }
}
