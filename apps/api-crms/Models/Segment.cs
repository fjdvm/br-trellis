namespace api_crms.Models;

public sealed class Segment
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public SegmentType Type { get; set; }

    public bool IsSystemDefined { get; set; }

    public string? Rule { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<SegmentMembership> Memberships { get; } = new List<SegmentMembership>();
}
