using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class WorkflowRunQueryServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"workflow-run-query-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ListWorkflowRuns_with_no_filter_returns_all_runs()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId1 = await SeedCartAsync(context, "cart-1");
        var cartId2 = await SeedCartAsync(context, "cart-2");
        await SeedWorkflowRunAsync(context, workflowId, cartId1);
        await SeedWorkflowRunAsync(context, workflowId, cartId2);

        var service = CreateService(context);
        var result = await service.ListWorkflowRunsAsync(null, CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ListWorkflowRuns_with_entityId_filter_returns_only_matching_run()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId1 = await SeedCartAsync(context, "cart-1");
        var cartId2 = await SeedCartAsync(context, "cart-2");
        await SeedWorkflowRunAsync(context, workflowId, cartId1);
        await SeedWorkflowRunAsync(context, workflowId, cartId2);

        var service = CreateService(context);
        var result = await service.ListWorkflowRunsAsync(cartId1, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(cartId1, result[0].EntityId);
    }

    [Fact]
    public async Task ListWorkflowRuns_resolves_entity_label_from_cart()
    {
        await using var context = CreateContext();
        var workflowId = await SeedWorkflowAsync(context);
        var cartId = await SeedCartAsync(context, "cart-abc");
        await SeedWorkflowRunAsync(context, workflowId, cartId);

        var service = CreateService(context);
        var result = await service.ListWorkflowRunsAsync(null, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("Cart cart-abc", result[0].EntityLabel);
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

    private static IWorkflowRunQueryService CreateService(AppDbContext context)
    {
        var repository = new WorkflowRunRepository(context);
        return new WorkflowRunQueryService(repository);
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

    private static async Task<Guid> SeedCartAsync(AppDbContext context, string platformCartId)
    {
        var cartId = Guid.NewGuid();
        context.Carts.Add(new Cart
        {
            Id = cartId,
            PlatformCartId = platformCartId,
            Status = CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        });
        await context.SaveChangesAsync();
        return cartId;
    }

    private static async Task<Guid> SeedWorkflowRunAsync(AppDbContext context, Guid workflowId, Guid cartId)
    {
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
        return run.Id;
    }
}
