namespace api_crms.CustomerIdentity.Persistence;

public sealed class SourceReference
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public string SourceSystem { get; set; } = string.Empty;

    public string SourceId { get; set; } = string.Empty;

    public decimal? MatchConfidence { get; set; }

    public SourceReferenceStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public Customer Customer { get; set; } = null!;

    public ICollection<IdentityMatchCandidate> IdentityMatchCandidates { get; } =
        new List<IdentityMatchCandidate>();
}

public enum SourceReferenceStatus
{
    Linked,
    PendingReview,
}
