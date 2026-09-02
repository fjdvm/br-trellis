using System.Security.Claims;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/campaigns")]
[Authorize]
public sealed class CampaignController(ICampaignService campaignService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CampaignListItemDto>>> ListCampaigns(
        [FromQuery] string? status = null,
        CancellationToken cancellationToken = default)
    {
        return Ok(await campaignService.ListCampaignsAsync(status, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CampaignDetailDto>> GetCampaign(
        Guid id,
        CancellationToken cancellationToken)
    {
        var campaign = await campaignService.GetCampaignByIdAsync(id, cancellationToken);
        return campaign is null ? NotFound() : Ok(campaign);
    }

    [HttpPost]
    public async Task<ActionResult<CampaignDetailDto>> CreateCampaign(
        CreateCampaignDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var campaign = await campaignService.CreateCampaignAsync(input, CurrentUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetCampaign), new { id = campaign.Id }, campaign);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CampaignDetailDto>> UpdateCampaign(
        Guid id,
        UpdateCampaignDto input,
        CancellationToken cancellationToken)
    {
        try
        {
            var campaign = await campaignService.UpdateCampaignAsync(id, input, cancellationToken);
            return campaign is null ? NotFound() : Ok(campaign);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCampaign(
        Guid id,
        CancellationToken cancellationToken)
    {
        var deleted = await campaignService.DeleteCampaignAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    // Launch / lifecycle transition. Currently only Draft -> Active (launch) is
    // supported; other target statuses are rejected. Mirrors the crm-client's
    // PUT /campaigns/{id}/status?status=Active.
    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult<CampaignDetailDto>> UpdateStatus(
        Guid id,
        [FromQuery] string status,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(status, "Active", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Only launching (status=Active) is supported." });
        }

        try
        {
            var campaign = await campaignService.LaunchCampaignAsync(id, cancellationToken);
            return campaign is null ? NotFound() : Ok(campaign);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    // --- Cross-service dispatch (api-oos polls these; ADR 0008) ---

    // Active Email campaigns due to send now, with resolved recipients + content.
    [HttpGet("due")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<DueCampaignDto>>> GetDueCampaigns(
        CancellationToken cancellationToken)
    {
        return Ok(await campaignService.GetDueEmailCampaignsAsync(cancellationToken));
    }

    // api-oos reports the bulk-send outcome back here.
    [HttpPost("{id:guid}/dispatch-result")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordDispatchResult(
        Guid id,
        CampaignDispatchResultDto result,
        CancellationToken cancellationToken)
    {
        var recorded = await campaignService.RecordDispatchResultAsync(id, result, cancellationToken);
        return recorded ? NoContent() : NotFound();
    }

    // Currently-Active Banner/Popup content for the storefront (served to web-shop
    // via api-oos, ADR 0008). 204 when nothing is active for that channel.
    [HttpGet("active-content")]
    [AllowAnonymous]
    public async Task<ActionResult<ActiveChannelContentDto>> GetActiveContent(
        [FromQuery] string channel,
        CancellationToken cancellationToken)
    {
        var content = await campaignService.GetActiveChannelContentAsync(channel, cancellationToken);
        return content is null ? NoContent() : Ok(content);
    }

    private string? CurrentUserId() =>
        User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User?.FindFirst("sub")?.Value;
}
