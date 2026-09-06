using api_crms.Data;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class CartServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"cart-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ListCarts_with_no_status_filter_returns_all_carts()
    {
        await using var context = CreateContext();
        context.Carts.Add(new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-active",
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddMinutes(-10),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-10),
        });
        context.Carts.Add(new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-abandoned",
            Status = CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListCartsAsync(null, CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ListCarts_with_status_filter_returns_only_matching_carts()
    {
        await using var context = CreateContext();
        context.Carts.Add(new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-active",
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddMinutes(-10),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-10),
        });
        var abandonedCart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-abandoned",
            Status = CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        context.Carts.Add(abandonedCart);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListCartsAsync(CartStatus.Abandoned, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(abandonedCart.Id, result[0].Id);
    }

    [Fact]
    public async Task ListCarts_includes_workflow_run_summary_when_a_running_run_exists()
    {
        await using var context = CreateContext();
        var contactId = Guid.NewGuid();
        context.Contacts.Add(new Contact
        {
            Id = contactId,
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Test Customer",
            Email = "test@example.com",
        });

        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-abandoned",
            ContactId = contactId,
            Status = CartStatus.Abandoned,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        context.Carts.Add(cart);

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

        context.WorkflowRuns.Add(new WorkflowRun
        {
            Id = Guid.NewGuid(),
            WorkflowId = workflow.Id,
            EntityId = cart.Id,
            EntityType = "Cart",
            CurrentStepIndex = 1,
            Status = WorkflowRunStatus.Running,
            StartedAt = DateTimeOffset.UtcNow.AddHours(-2),
            NextStepDueAt = DateTimeOffset.UtcNow.AddHours(1),
        });

        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListCartsAsync(null, CancellationToken.None);

        var returnedCart = Assert.Single(result);
        Assert.NotNull(returnedCart.WorkflowRun);
        Assert.Equal(1, returnedCart.WorkflowRun!.CurrentStepIndex);
        Assert.Equal(2, returnedCart.WorkflowRun.TotalSteps);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private static CartService CreateService(AppDbContext context)
    {
        ICartRepository repository = new CartRepository(context);
        return new CartService(repository);
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
}
