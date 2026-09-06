using api_crms.Models;

namespace api_crms.Interfaces;

public interface ICannedReplyCategoryRepository
{
    Task<IReadOnlyList<CannedReplyCategory>> ListCategoriesAsync(
        bool includeArchived,
        CancellationToken cancellationToken);

    Task<CannedReplyCategory?> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken);
}
