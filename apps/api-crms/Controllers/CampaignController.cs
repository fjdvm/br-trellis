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

    private string? CurrentUserId() =>
        User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? User?.FindFirst("sub")?.Value;
}
