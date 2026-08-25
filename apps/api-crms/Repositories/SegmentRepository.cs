using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class SegmentRepository(AppDbContext dbContext) : ISegmentRepository
{
    public async Task<Segment?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Segments.AsNoTracking()
            .Where(s => s.DeletedAt == null && s.Id == id)
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Contact>> GetStaticMembersAsync(
        Guid segmentId,
        CancellationToken cancellationToken)
    {
        return await dbContext.SegmentMemberships.AsNoTracking()
            .Where(m => m.SegmentId == segmentId)
            .Include(m => m.Contact)
            .Select(m => m.Contact)
            .Where(c => c.DeletedAt == null)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteAsync(Segment segment, CancellationToken cancellationToken)
    {
        var tracked = await dbContext.Segments.FindAsync([segment.Id], cancellationToken)
            ?? throw new InvalidOperationException("Segment not found.");
        tracked.DeletedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
