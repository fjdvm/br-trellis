using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ICannedReplyService
{
    Task<IReadOnlyList<CannedReplyListItemDto>> ListRepliesAsync(
        bool includeArchived,
        Guid? categoryId,
        CancellationToken cancellationToken);

    Task<CannedReplyDetailDto?> GetReplyByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<CannedReplyDetailDto> CreateReplyAsync(CreateCannedReplyDto input, CancellationToken cancellationToken);

    Task<CannedReplyDetailDto?> UpdateReplyAsync(Guid id, UpdateCannedReplyDto input, CancellationToken cancellationToken);

    Task<bool> ArchiveReplyAsync(Guid id, CancellationToken cancellationToken);

    Task<CannedReplyDetailDto?> RestoreReplyAsync(Guid id, CancellationToken cancellationToken);
}
