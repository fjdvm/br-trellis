using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class CannedReplyCategoryMapper
{
    public static CannedReplyCategoryListItemDto ToListItem(CannedReplyCategory category)
    {
        return new CannedReplyCategoryListItemDto(
            category.Id,
            category.Name,
            category.CannedReplies.Count(r => r.DeletedAt == null),
            category.CreatedAt,
            category.DeletedAt);
    }

    public static IReadOnlyList<CannedReplyCategoryListItemDto> ToListItems(
        IEnumerable<CannedReplyCategory> categories)
    {
        return categories.Select(ToListItem).ToList();
    }

    public static CannedReplyCategoryDetailDto ToDetail(CannedReplyCategory category)
    {
        return new CannedReplyCategoryDetailDto(
            category.Id,
            category.Name,
            category.CreatedAt,
            category.DeletedAt,
            category.CannedReplies.Count(r => r.DeletedAt == null));
    }
}
