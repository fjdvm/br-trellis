namespace api_crms.CustomerIdentity.Persistence;

public sealed class IdentityMatchCandidate
{
    public Guid Id { get; set; }

    public Guid SourceReferenceId { get; set; }

    public Guid CandidateCustomerId { get; set; }

    public decimal ConfidenceScore { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public SourceReference SourceReference { get; set; } = null!;

    public Customer CandidateCustomer { get; set; } = null!;
}
