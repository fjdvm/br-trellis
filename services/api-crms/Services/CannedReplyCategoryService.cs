using api_crms.Data;
using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed class CannedReplyCategoryService(
    ICannedReplyCategoryRepository categoryRepository,
    AppDbContext dbContext) : ICannedReplyCategoryService
{
    public async Task<IReadOnlyList<CannedReplyCategoryListItemDto>> ListCategoriesAsync(
        bool includeArchived,
        CancellationToken cancellationToken)
    {
        var categories = await categoryRepository.ListCategoriesAsync(includeArchived, cancellationToken);
        return CannedReplyCategoryMapper.ToListItems(categories);
    }

    public async Task<CannedReplyCategoryDetailDto?> GetCategoryByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await categoryRepository.GetCategoryByIdAsync(id, cancellationToken);
        return category is null ? null : CannedReplyCategoryMapper.ToDetail(category);
    }

    public async Task<CannedReplyCategoryDetailDto> CreateCategoryAsync(
        CreateCannedReplyCategoryDto input,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
        {
            throw new ArgumentException("Category name is required.");
        }

        var category = new CannedReplyCategory
        {
            Id = Guid.NewGuid(),
            Name = input.Name.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.CannedReplyCategories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await categoryRepository.GetCategoryByIdAsync(category.Id, cancellationToken);
        return CannedReplyCategoryMapper.ToDetail(full!);
    }

    public async Task<CannedReplyCategoryDetailDto?> UpdateCategoryAsync(
        Guid id,
        UpdateCannedReplyCategoryDto input,
        CancellationToken cancellationToken)
    {
        var category = await dbContext.CannedReplyCategories.FindAsync([id], cancellationToken);
        if (category is null || category.DeletedAt is not null)
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(input.Name))
        {
            category.Name = input.Name.Trim();
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await categoryRepository.GetCategoryByIdAsync(id, cancellationToken);
        return full is null ? null : CannedReplyCategoryMapper.ToDetail(full);
    }

    public async Task<bool> ArchiveCategoryAsync(Guid id, CancellationToken cancellationToken)
    {
        var category = await dbContext.CannedReplyCategories.FindAsync([id], cancellationToken);
        if (category is null || category.DeletedAt is not null)
        {
            return false;
        }

        var hasActiveReplies = await dbContext.CannedReplies
            .AnyAsync(r => r.CategoryId == id && r.DeletedAt == null, cancellationToken);
        if (hasActiveReplies)
        {
            throw new ArgumentException(
                "Cannot archive a category that still contains active canned replies. "
                + "Move or archive its canned replies first.");
        }

        category.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CannedReplyCategoryDetailDto?> RestoreCategoryAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var category = await dbContext.CannedReplyCategories.FindAsync([id], cancellationToken);
        if (category is null || category.DeletedAt is null)
        {
            return null;
        }

        category.DeletedAt = null;
        await dbContext.SaveChangesAsync(cancellationToken);

        var full = await categoryRepository.GetCategoryByIdAsync(id, cancellationToken);
        return full is null ? null : CannedReplyCategoryMapper.ToDetail(full);
    }
}
