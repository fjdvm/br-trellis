using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/block-templates")]
public sealed class BlockTemplateController(IBlockTemplateService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BlockTemplateDto>>> List(
        [FromQuery] string? channel = null,
        [FromQuery] bool includeArchived = false,
        CancellationToken ct = default)
    {
        var result = await service.ListAsync(channel, includeArchived, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BlockTemplateDto>> GetById(Guid id, CancellationToken ct = default)
    {
        var result = await service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<BlockTemplateDto>> Create(
        [FromBody] CreateBlockTemplateInput input,
        CancellationToken ct = default)
    {
        try
        {
            var result = await service.CreateAsync(input, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BlockTemplateDto>> Update(
        Guid id,
        [FromBody] UpdateBlockTemplateInput input,
        CancellationToken ct = default)
    {
        try
        {
            var result = await service.UpdateAsync(id, input, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct = default)
    {
        var success = await service.ArchiveAsync(id, ct);
        return success ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct = default)
    {
        var success = await service.ArchiveAsync(id, ct);
        return success ? NoContent() : NotFound();
    }
}
