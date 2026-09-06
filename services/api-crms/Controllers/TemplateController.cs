using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/templates")]
[Authorize]
public sealed class TemplateController(ITemplateService templateService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TemplateDto>>> ListTemplates(
        [FromQuery] string? channel = null,
        CancellationToken cancellationToken = default)
    {
        return Ok(await templateService.ListTemplatesAsync(channel, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TemplateDto>> GetTemplate(
        Guid id,
        CancellationToken cancellationToken)
    {
        var template = await templateService.GetTemplateByIdAsync(id, cancellationToken);
        return template is null ? NotFound() : Ok(template);
    }
}
