using api_crms.CustomerIdentity.Persistence;
using api_crms.DTOs;

namespace api_crms.Mappers;

public static class PendingReviewCustomerMapper
{
    public static IReadOnlyList<PendingReviewCustomer> ToReadModel(
        IEnumerable<SourceReference> sourceReferences)
    {
        return sourceReferences.OrderBy(reference => reference.CreatedAt).Select(reference =>
            new PendingReviewCustomer(
                new PendingReviewCustomerDetails(
                    reference.Customer.Id,
                    reference.Customer.Name,
                    reference.Customer.Email,
                    reference.Customer.Phone),
                reference.IdentityMatchCandidates
                    .OrderByDescending(candidate => candidate.ConfidenceScore)
                    .Select(candidate => new PendingReviewCandidate(
                        new PendingReviewCustomerDetails(
                            candidate.CandidateCustomer.Id,
                            candidate.CandidateCustomer.Name,
                            candidate.CandidateCustomer.Email,
                            candidate.CandidateCustomer.Phone),
                        candidate.ConfidenceScore))
                    .ToList())).ToList();
    }
}
