using api_crms.Enums;
using api_crms.Models;

namespace api_crms.Interfaces;

public interface ICartRepository
{
    Task<IReadOnlyList<Cart>> ListCartsAsync(CartStatus? status, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<Guid, WorkflowRun>> GetActiveWorkflowRunsByEntityIdAsync(
        IReadOnlyList<Guid> cartIds, CancellationToken cancellationToken);
}
