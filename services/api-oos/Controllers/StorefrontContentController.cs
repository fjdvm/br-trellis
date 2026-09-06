namespace ApiOos.Controllers;

using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Customer-facing storefront content endpoints (#163). web-shop polls these for
/// the currently-Active Banner/Popup; api-oos proxies api-crms server-to-server
/// (web-shop never calls api-crms directly, ADR 0005). 204 when nothing is active.
/// </summary>
[ApiController]
[AllowAnonymous]
public sealed class StorefrontContentController(IActiveContentReader reader) : ControllerBase
{
    [HttpGet("api/banner/active")]
    public async Task<ActionResult<ActiveContent>> GetActiveBanner(CancellationToken cancellationToken)
    {
        var content = await reader.GetActiveContentAsync("Banner", cancellationToken);
        return content is null ? NoContent() : Ok(content);
    }

    [HttpGet("api/popup/active")]
    public async Task<ActionResult<ActiveContent>> GetActivePopup(CancellationToken cancellationToken)
    {
        var content = await reader.GetActiveContentAsync("Popup", cancellationToken);
        return content is null ? NoContent() : Ok(content);
    }
}
