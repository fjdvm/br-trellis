using api_crms.Models;

namespace api_crms.Interfaces;

public interface ISegmentService
{
    Task<IReadOnlyList<Contact>> EvaluateSegmentAsync(
        Guid segmentId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Contact>> GetStaticMembersAsync(
        Guid segmentId,
        CancellationToken cancellationToken);

    Task DeleteSegmentAsync(Guid segmentId, CancellationToken cancellationToken);
}
