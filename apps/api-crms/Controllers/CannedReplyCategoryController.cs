using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/canned-reply-categories")]
[Authorize]
public sealed class CannedReplyCategoryController(
    ICannedReplyCategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CannedReplyCategoryListItemDto>>> ListCategories(
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        return Ok(await categoryService.ListCategoriesAsync(includeArchived, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CannedReplyCategoryDetailDto>> GetCategory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await categoryService.GetCategoryByIdAsync(id, cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    [HttpPost]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<ActionResult<CannedReplyCategoryDetailDto>> CreateCategory(
        CreateCannedReplyCategoryDto input,
        CancellationToken cancellationToken)
    {
        var category = await categoryService.CreateCategoryAsync(input, cancellationToken);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<ActionResult<CannedReplyCategoryDetailDto>> UpdateCategory(
        Guid id,
        UpdateCannedReplyCategoryDto input,
        CancellationToken cancellationToken)
    {
        var category = await categoryService.UpdateCategoryAsync(id, input, cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<IActionResult> ArchiveCategory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var archived = await categoryService.ArchiveCategoryAsync(id, cancellationToken);
        return archived ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/restore")]
    [Authorize(Policy = CrmPermissionPolicies.ConversationsCanWrite)]
    public async Task<ActionResult<CannedReplyCategoryDetailDto>> RestoreCategory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await categoryService.RestoreCategoryAsync(id, cancellationToken);
        return category is null ? NotFound() : Ok(category);
    }
}
