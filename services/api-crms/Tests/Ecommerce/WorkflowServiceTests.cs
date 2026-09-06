using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class WorkflowServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"workflow-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task StartWorkflowRun_creates_a_running_run_with_first_step_due()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var entityId = Guid.NewGuid();
        var service = new WorkflowService(context);

        var runId = await service.StartWorkflowRunAsync(workflowId, entityId, "Cart");

        var run = await context.WorkflowRuns.SingleAsync();
        Assert.Equal(runId, run.Id);
        Assert.Equal(workflowId, run.WorkflowId);
        Assert.Equal(entityId, run.EntityId);
        Assert.Equal("Cart", run.EntityType);
        Assert.Equal(0, run.CurrentStepIndex);
        Assert.Equal(WorkflowRunStatus.Running, run.Status);
    }

    [Fact]
    public async Task AdvanceDueRuns_advances_a_due_run_to_next_step()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId = await SeedCartWithContactAsync(context);

        // Seed a run that's already due (NextStepDueAt in the past)
        var run = new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            EntityId = cartId,
            EntityType = "Cart",
            CurrentStepIndex = 0,
            Status = WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-2),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(-1),
        };
        context.WorkflowRuns.Add(run);
        await context.SaveChangesAsync();

        var service = new WorkflowService(context);
        var advanced = await service.AdvanceDueRunsAsync();

        Assert.Equal(1, advanced);
        var updated = await context.WorkflowRuns.SingleAsync();
        Assert.Equal(1, updated.CurrentStepIndex);
        Assert.Equal(WorkflowRunStatus.Running, updated.Status);
    }

    [Fact]
    public async Task AdvanceDueRuns_completes_run_after_last_step()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId = await SeedCartWithContactAsync(context);

        // Seed a run at the last step (index 1 of 2 steps), already due
        var run = new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            EntityId = cartId,
            EntityType = "Cart",
            CurrentStepIndex = 1,
            Status = WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddDays(-2),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(-1),
        };
        context.WorkflowRuns.Add(run);
        await context.SaveChangesAsync();

        var service = new WorkflowService(context);
        await service.AdvanceDueRunsAsync();

        var updated = await context.WorkflowRuns.SingleAsync();
        Assert.Equal(WorkflowRunStatus.Completed, updated.Status);
        Assert.NotNull(updated.CompletedAt);
    }

    [Fact]
    public async Task AdvanceDueRuns_stops_run_when_stop_condition_is_met()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var (cartId, contactId) = await SeedCartWithContactAndReturnBothAsync(context);

        // Seed an order for the contact (simulating the customer converted)
        context.Orders.Add(new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = "order-converted",
            ContactId = contactId,
            Status = OrderStatus.Paid,
            Total = 100m,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        // Seed a running workflow run with due step
        var run = new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            EntityId = cartId,
            EntityType = "Cart",
            CurrentStepIndex = 0,
            Status = WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-2),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(-1),
        };
        context.WorkflowRuns.Add(run);
        await context.SaveChangesAsync();

        var service = new WorkflowService(context);
        await service.AdvanceDueRunsAsync();

        var updated = await context.WorkflowRuns.SingleAsync();
        Assert.Equal(WorkflowRunStatus.Stopped, updated.Status);
        Assert.NotNull(updated.CompletedAt);
        // Step index should NOT advance because action was never executed
        Assert.Equal(0, updated.CurrentStepIndex);
    }

    [Fact]
    public async Task AdvanceDueRuns_does_not_advance_runs_not_yet_due()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId = await SeedCartWithContactAsync(context);

        // Seed a run that's NOT due yet
        var run = new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            EntityId = cartId,
            EntityType = "Cart",
            CurrentStepIndex = 0,
            Status = WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow,
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(1), // future
        };
        context.WorkflowRuns.Add(run);
        await context.SaveChangesAsync();

        var service = new WorkflowService(context);
        var advanced = await service.AdvanceDueRunsAsync();

        Assert.Equal(0, advanced);
        var updated = await context.WorkflowRuns.SingleAsync();
        Assert.Equal(0, updated.CurrentStepIndex);
        Assert.Equal(WorkflowRunStatus.Running, updated.Status);
    }

    [Fact]
    public async Task AdvanceDueRuns_does_not_advance_stopped_or_completed_runs()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId = await SeedCartWithContactAsync(context);

        // Seed a stopped run that would be due
        context.WorkflowRuns.Add(new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflowId,
            EntityId = cartId,
            EntityType = "Cart",
            CurrentStepIndex = 0,
            Status = WorkflowRunStatus.Stopped,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-2),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(-1),
            CompletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = new WorkflowService(context);
        var advanced = await service.AdvanceDueRunsAsync();

        Assert.Equal(0, advanced);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={_databasePath}")
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private static async Task<Guid> SeedWorkflowAsync(AppDbContext context)
    {
        var workflow = new Workflow
        {
            Id = Guid.NewGuid(),
            Name = "Abandoned Cart Recovery",
            TriggerType = "cart.abandoned",
            StopCondition = "order_completed",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        workflow.Steps.Add(new WorkflowStep
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            StepOrder = 0,
            WaitDuration = TimeSpan.FromHours(1),
            ActionType = "email",
            ActionConfig = "{\"template\":\"reminder_1\"}",
        });
        workflow.Steps.Add(new WorkflowStep
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            StepOrder = 1,
            WaitDuration = TimeSpan.FromHours(24),
            ActionType = "email",
            ActionConfig = "{\"template\":\"discount_offer\"}",
        });
        context.Workflows.Add(workflow);
        await context.SaveChangesAsync();
        return workflow.Id;
    }

    private static async Task<Guid> SeedCartWithContactAsync(AppDbContext context)
    {
        var contactId = Guid.NewGuid();
        context.Contacts.Add(new Contact
        {
            Id = contactId,
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Test Customer",
            Email = "test@example.com",
        });
        var cartId = Guid.NewGuid();
        context.Carts.Add(new Cart
        {
            Id = cartId,
            PlatformCartId = "cart-wf-test",
            ContactId = contactId,
            Status = CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        });
        await context.SaveChangesAsync();
        return cartId;
    }

    private static async Task<(Guid CartId, Guid ContactId)> SeedCartWithContactAndReturnBothAsync(
        AppDbContext context)
    {
        var contactId = Guid.NewGuid();
        context.Contacts.Add(new Contact
        {
            Id = contactId,
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Test Customer",
            Email = "test@example.com",
        });
        var cartId = Guid.NewGuid();
        context.Carts.Add(new Cart
        {
            Id = cartId,
            PlatformCartId = "cart-wf-test",
            ContactId = contactId,
            Status = CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        });
        await context.SaveChangesAsync();
        return (cartId, contactId);
    }
}
