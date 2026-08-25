using api_crms.DTOs;
using api_crms.Services;

namespace api_crms.Interfaces;

public interface IContactIdentityService
{
    Task<ResolveOrCreateContactResult> ResolveOrCreateContactAsync(
        ResolveOrCreateContactCommand command,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PendingReviewContact>> ListPendingReviewContactsAsync(
        CancellationToken cancellationToken = default);
}
