using api_crms.Models;

namespace api_crms.Interfaces;

public interface ISegmentRepository
{
    Task<Segment?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Segment>> ListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<Contact>> GetStaticMembersAsync(
        Guid segmentId,
        CancellationToken cancellationToken);

    Task DeleteAsync(Segment segment, CancellationToken cancellationToken);
}
