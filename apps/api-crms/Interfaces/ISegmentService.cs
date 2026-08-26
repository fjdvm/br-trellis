using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Interfaces;

public interface ISegmentService
{
    Task<IReadOnlyList<SegmentDto>> ListSegmentsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<SegmentMemberDto>?> GetSegmentMembersAsync(
        Guid segmentId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Contact>> EvaluateSegmentAsync(
        Guid segmentId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Contact>> GetStaticMembersAsync(
        Guid segmentId,
        CancellationToken cancellationToken);

    Task DeleteSegmentAsync(Guid segmentId, CancellationToken cancellationToken);
}
