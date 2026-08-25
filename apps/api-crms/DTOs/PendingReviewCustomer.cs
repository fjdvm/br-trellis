namespace api_crms.DTOs;

public sealed record PendingReviewCustomer(
    PendingReviewCustomerDetails Customer,
    IReadOnlyList<PendingReviewCandidate> Candidates);

public sealed record PendingReviewCustomerDetails(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone);

public sealed record PendingReviewCandidate(
    PendingReviewCustomerDetails Customer,
    decimal ConfidenceScore);
