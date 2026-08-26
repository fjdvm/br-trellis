using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IWorkflowRunQueryService
{
    Task<IReadOnlyList<WorkflowRunListItemDto>> ListWorkflowRunsAsync(
        Guid? entityId, CancellationToken cancellationToken);
}
