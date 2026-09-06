using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Services;

public sealed class WorkflowService(AppDbContext dbContext) : IWorkflowService
{
    public async Task<Guid> StartWorkflowRunAsync(
        Guid workflowId, Guid entityId, string entityType,
        CancellationToken cancellationToken = default)
    {
        var workflow = await dbContext.Workflows
            .Include(w => w.Steps)
            .FirstOrDefaultAsync(w => w.Id == workflowId, cancellationToken)
            ?? throw new InvalidOperationException("Workflow not found.");

        var firstStep = workflow.Steps.OrderBy(s => s.StepOrder).FirstOrDefault()
            ?? throw new InvalidOperationException("Workflow has no steps.");

        var now = DateTimeOffset.UtcNow;
        var run = new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            EntityId = entityId,
            EntityType = entityType,
            CurrentStepIndex = 0,
            Status = WorkflowRunStatus.Running,
            StartedAt = now,
            NextStepDueAt = now + firstStep.WaitDuration,
        };

        dbContext.WorkflowRuns.Add(run);
        await dbContext.SaveChangesAsync(cancellationToken);
        return run.Id;
    }

    public async Task<int> AdvanceDueRunsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;

        // Load all running runs and filter in memory (SQLite DateTimeOffset issue)
        var allRunning = await dbContext.WorkflowRuns
            .Include(r => r.Workflow)
                .ThenInclude(w => w.Steps)
            .Where(r => r.Status == WorkflowRunStatus.Running)
            .ToListAsync(cancellationToken);

        var dueRuns = allRunning.Where(r => r.NextStepDueAt <= now).ToList();
        var advancedCount = 0;

        foreach (var run in dueRuns)
        {
            var steps = run.Workflow.Steps.OrderBy(s => s.StepOrder).ToList();
            if (run.CurrentStepIndex >= steps.Count)
            {
                run.Status = WorkflowRunStatus.Completed;
                run.CompletedAt = now;
                advancedCount++;
                continue;
            }

            // Check stop condition BEFORE executing action
            if (await IsStopConditionMetAsync(run, cancellationToken))
            {
                run.Status = WorkflowRunStatus.Stopped;
                run.CompletedAt = now;
                advancedCount++;
                continue;
            }

            // Execute action for current step
            var currentStep = steps[run.CurrentStepIndex];
            await ExecuteStepActionAsync(run, currentStep, cancellationToken);

            // Advance to next step
            run.CurrentStepIndex++;

            if (run.CurrentStepIndex >= steps.Count)
            {
                run.Status = WorkflowRunStatus.Completed;
                run.CompletedAt = now;
            }
            else
            {
                var nextStep = steps[run.CurrentStepIndex];
                run.NextStepDueAt = now + nextStep.WaitDuration;
            }

            advancedCount++;
        }

        if (advancedCount > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return advancedCount;
    }

    private async Task<bool> IsStopConditionMetAsync(
        WorkflowRun run, CancellationToken cancellationToken)
    {
        if (run.Workflow.StopCondition == "order_completed" && run.EntityType == "Cart")
        {
            // Check if an order now exists for the cart's contact
            var cart = await dbContext.Carts
                .FirstOrDefaultAsync(c => c.Id == run.EntityId, cancellationToken);

            if (cart?.ContactId is null) return false;

            return await dbContext.Orders
                .Where(o => o.ContactId == cart.ContactId)
                .AnyAsync(cancellationToken);
        }

        return false;
    }

    private Task ExecuteStepActionAsync(
        WorkflowRun run, WorkflowStep step, CancellationToken cancellationToken)
    {
        // V1: email action — log intent (actual email sending is out of scope)
        // In production this would integrate with an email service
        if (step.ActionType == "email")
        {
            // For now, this is a no-op placeholder.
            // The action config contains the template/content to send.
        }

        return Task.CompletedTask;
    }
}
