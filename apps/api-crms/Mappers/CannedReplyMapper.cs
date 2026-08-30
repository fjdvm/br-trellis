using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class CannedReplyMapper
{
    public static CannedReplyListItemDto ToListItem(CannedReply reply)
    {
        return new CannedReplyListItemDto(
            reply.Id,
            reply.CategoryId,
            reply.Category?.Name ?? string.Empty,
            reply.Name,
            reply.Body,
            reply.CreatedAt,
            reply.DeletedAt);
    }

    public static IReadOnlyList<CannedReplyListItemDto> ToListItems(IEnumerable<CannedReply> replies)
    {
        return replies.Select(ToListItem).ToList();
    }

    public static CannedReplyDetailDto ToDetail(CannedReply reply)
    {
        return new CannedReplyDetailDto(
            reply.Id,
            reply.CategoryId,
            reply.Category?.Name ?? string.Empty,
            reply.Name,
            reply.Body,
            reply.CreatedAt,
            reply.DeletedAt);
    }
}
