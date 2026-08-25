namespace api_crms.Models;

public sealed class SegmentMembership
{
    public Guid SegmentId { get; set; }

    public Guid ContactId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public Segment Segment { get; set; } = null!;

    public Contact Contact { get; set; } = null!;
}
