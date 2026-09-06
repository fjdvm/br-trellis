namespace api_crms.Models;

public sealed class IdentityMatchCandidate
{
    public Guid Id { get; set; }

    public Guid SourceReferenceId { get; set; }

    public Guid CandidateContactId { get; set; }

    public decimal ConfidenceScore { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? DeletedAt { get; set; }

    public SourceReference SourceReference { get; set; } = null!;

    public Contact CandidateContact { get; set; } = null!;
}
