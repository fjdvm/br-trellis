using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class WorkflowRunMapper
{
    public static IReadOnlyList<WorkflowRunListItemDto> ToListItems(
        IEnumerable<WorkflowRun> runs,
        IReadOnlyDictionary<Guid, string> cartLabelsById)
    {
        return runs.Select(run => new WorkflowRunListItemDto(
            run.Id,
            run.WorkflowId,
            run.Workflow.Name,
            run.EntityId,
            run.EntityType,
            run.EntityType == "Cart" && cartLabelsById.TryGetValue(run.EntityId, out var label) ? label : null,
            run.CurrentStepIndex,
            run.Workflow.Steps.Count,
            run.Status.ToString(),
            run.StartedAt,
            run.NextStepDueAt,
            run.CompletedAt
        )).ToList();
    }
}
