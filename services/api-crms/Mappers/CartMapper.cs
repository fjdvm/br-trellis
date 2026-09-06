using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class CartMapper
{
    public static IReadOnlyList<CartListItemDto> ToListItems(
        IEnumerable<Cart> carts,
        IReadOnlyDictionary<Guid, WorkflowRun> workflowRunsByCartId)
    {
        return carts.Select(cart =>
        {
            WorkflowRunSummaryDto? workflowRunDto = null;
            if (workflowRunsByCartId.TryGetValue(cart.Id, out var run))
            {
                workflowRunDto = new WorkflowRunSummaryDto(
                    run.Id,
                    run.Workflow.Name,
                    run.CurrentStepIndex,
                    run.Workflow.Steps.Count,
                    run.Status.ToString(),
                    run.NextStepDueAt);
            }

            return new CartListItemDto(
                cart.Id,
                cart.PlatformCartId,
                cart.ContactId,
                cart.Contact?.Name,
                cart.Contact?.Email,
                cart.Status.ToString(),
                cart.Items.Count,
                cart.Items.Sum(i => i.Quantity * i.UnitPrice),
                cart.LastActivityAt,
                workflowRunDto);
        }).ToList();
    }
}
