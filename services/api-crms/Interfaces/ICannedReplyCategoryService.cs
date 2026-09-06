using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ICannedReplyCategoryService
{
    Task<IReadOnlyList<CannedReplyCategoryListItemDto>> ListCategoriesAsync(
        bool includeArchived,
        CancellationToken cancellationToken);

    Task<CannedReplyCategoryDetailDto?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<CannedReplyCategoryDetailDto> CreateCategoryAsync(
        CreateCannedReplyCategoryDto input,
        CancellationToken cancellationToken);

    Task<CannedReplyCategoryDetailDto?> UpdateCategoryAsync(
        Guid id,
        UpdateCannedReplyCategoryDto input,
        CancellationToken cancellationToken);

    Task<bool> ArchiveCategoryAsync(Guid id, CancellationToken cancellationToken);

    Task<CannedReplyCategoryDetailDto?> RestoreCategoryAsync(Guid id, CancellationToken cancellationToken);
}
