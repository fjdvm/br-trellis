using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class PendingReviewContactMapper
{
    public static IReadOnlyList<PendingReviewContact> ToReadModel(
        IEnumerable<SourceReference> sourceReferences)
    {
        return sourceReferences.OrderBy(reference => reference.CreatedAt).Select(reference =>
            new PendingReviewContact(
                new PendingReviewContactDetails(
                    reference.Contact.Id,
                    reference.Contact.Name,
                    reference.Contact.Email,
                    reference.Contact.Phone),
                reference.IdentityMatchCandidates
                    .OrderByDescending(candidate => candidate.ConfidenceScore)
                    .Select(candidate => new PendingReviewContactCandidate(
                        new PendingReviewContactDetails(
                            candidate.CandidateContact.Id,
                            candidate.CandidateContact.Name,
                            candidate.CandidateContact.Email,
                            candidate.CandidateContact.Phone),
                        candidate.ConfidenceScore))
                    .ToList())).ToList();
    }
}
