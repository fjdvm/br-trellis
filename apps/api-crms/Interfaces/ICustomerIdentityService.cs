using api_crms.CustomerIdentity;
using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface ICustomerIdentityService
{
    Task<ResolveOrCreateCustomerResult> ResolveOrCreateCustomerAsync(
        ResolveOrCreateCustomerCommand command,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PendingReviewCustomer>> ListPendingReviewCustomersAsync(
        CancellationToken cancellationToken = default);
}
