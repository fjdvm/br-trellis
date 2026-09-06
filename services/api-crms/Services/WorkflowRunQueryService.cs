using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class WorkflowRunQueryService(
    IWorkflowRunRepository workflowRunRepository) : IWorkflowRunQueryService
{
    public async Task<IReadOnlyList<WorkflowRunListItemDto>> ListWorkflowRunsAsync(
        Guid? entityId, CancellationToken cancellationToken)
    {
        var runs = await workflowRunRepository.ListWorkflowRunsAsync(entityId, cancellationToken);
        var cartIds = runs.Where(r => r.EntityType == "Cart").Select(r => r.EntityId).Distinct().ToList();
        var cartLabels = await workflowRunRepository.GetCartLabelsByIdAsync(cartIds, cancellationToken);
        return WorkflowRunMapper.ToListItems(runs, cartLabels);
    }
}
