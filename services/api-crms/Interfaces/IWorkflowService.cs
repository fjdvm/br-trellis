namespace api_crms.Interfaces;

public interface IWorkflowService
{
    Task<Guid> StartWorkflowRunAsync(
        Guid workflowId, Guid entityId, string entityType,
        CancellationToken cancellationToken = default);

    Task<int> AdvanceDueRunsAsync(CancellationToken cancellationToken = default);
}
