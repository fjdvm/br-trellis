using api_crms.Models;

namespace api_crms.Interfaces;

public interface ICannedReplyRepository
{
    Task<IReadOnlyList<CannedReply>> ListRepliesAsync(
        bool includeArchived,
        Guid? categoryId,
        CancellationToken cancellationToken);

    Task<CannedReply?> GetReplyByIdAsync(Guid id, CancellationToken cancellationToken);
}
