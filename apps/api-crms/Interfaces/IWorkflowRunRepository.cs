using api_crms.Models;

namespace api_crms.Interfaces;

public interface IWorkflowRunRepository
{
    Task<IReadOnlyList<WorkflowRun>> ListWorkflowRunsAsync(Guid? entityId, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<Guid, string>> GetCartLabelsByIdAsync(
        IReadOnlyList<Guid> cartIds, CancellationToken cancellationToken);
}
