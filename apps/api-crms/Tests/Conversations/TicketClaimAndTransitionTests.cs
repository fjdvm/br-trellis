using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Conversations;

public sealed class TicketClaimAndTransitionTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ticket-claim-{Guid.NewGuid():N}.db");

    private static readonly ClaimTicketDto Amelia =
        new("auth|amelia", "Amelia Ward", "Amelia.Ward@Trellis.io");

    [Fact]
    public async Task Claim_unclaimed_ticket_assigns_and_moves_to_claimed()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);
        var service = CreateService(context);

        var result = await service.ClaimTicketAsync(id, Amelia, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Claimed", result!.Status);
        Assert.Equal("auth|amelia", result.AssignedToId);
        Assert.Equal("Amelia Ward", result.AssignedToName);
        Assert.Equal("amelia.ward@trellis.io", result.AssignedToEmail); // normalized lowercase
    }

    [Fact]
    public async Task Claim_ongoing_ticket_with_null_assignee_succeeds()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Ongoing, assignedToId: null);
        var service = CreateService(context);

        var result = await service.ClaimTicketAsync(id, Amelia, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Claimed", result!.Status);
        Assert.Equal("auth|amelia", result.AssignedToId);
    }

    [Fact]
    public async Task Claim_already_claimed_ticket_by_someone_else_fails_without_side_effects()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(
            context, TicketStatus.Claimed, assignedToId: "auth|noah",
            assignedToName: "Noah Patel", assignedToEmail: "noah@trellis.io");
        var service = CreateService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ClaimTicketAsync(id, Amelia, CancellationToken.None));

        // Original assignment untouched
        context.ChangeTracker.Clear();
        var ticket = await context.Tickets.FindAsync(id);
        Assert.Equal(TicketStatus.Claimed, ticket!.Status);
        Assert.Equal("auth|noah", ticket.AssignedToId);
        Assert.Equal("Noah Patel", ticket.AssignedToName);
    }

    [Fact]
    public async Task Claim_returns_null_for_missing_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ClaimTicketAsync(Guid.NewGuid(), Amelia, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Assignee_snapshot_does_not_change_on_reread()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);
        var service = CreateService(context);

        await service.ClaimTicketAsync(id, Amelia, CancellationToken.None);

        // Re-read later — snapshot fields are stable (no recomputation from any staff source)
        context.ChangeTracker.Clear();
        var reread = await service.GetTicketByIdAsync(id, CancellationToken.None);
        Assert.Equal("auth|amelia", reread!.AssignedToId);
        Assert.Equal("Amelia Ward", reread.AssignedToName);
        Assert.Equal("amelia.ward@trellis.io", reread.AssignedToEmail);
    }

    [Fact]
    public async Task Unclaim_claimed_ticket_restores_unclaimed_and_clears_assignee()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(
            context, TicketStatus.Claimed, assignedToId: "auth|amelia",
            assignedToName: "Amelia Ward", assignedToEmail: "amelia@trellis.io");
        var service = CreateService(context);

        var result = await service.UnclaimTicketAsync(id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Unclaimed", result!.Status);
        Assert.Null(result.AssignedToId);
        Assert.Null(result.AssignedToName);
        Assert.Null(result.AssignedToEmail);
    }

    [Fact]
    public async Task Unclaim_ongoing_ticket_restores_unclaimed()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(
            context, TicketStatus.Ongoing, assignedToId: "auth|amelia");
        var service = CreateService(context);

        var result = await service.UnclaimTicketAsync(id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Unclaimed", result!.Status);
        Assert.Null(result.AssignedToId);
    }

    [Fact]
    public async Task Unclaim_unclaimed_ticket_fails()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);
        var service = CreateService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UnclaimTicketAsync(id, CancellationToken.None));
    }

    [Theory]
    [InlineData(TicketStatus.Unclaimed, "Claimed")]
    [InlineData(TicketStatus.Claimed, "Ongoing")]
    [InlineData(TicketStatus.Ongoing, "Completed")]
    [InlineData(TicketStatus.Unclaimed, "Canceled")]
    [InlineData(TicketStatus.Claimed, "Canceled")]
    [InlineData(TicketStatus.Ongoing, "Canceled")]
    public async Task ChangeStatus_allows_valid_transitions(TicketStatus from, string to)
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, from);
        var service = CreateService(context);

        var result = await service.ChangeStatusAsync(
            id, new ChangeTicketStatusDto(to), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(to, result!.Status);
    }

    [Theory]
    [InlineData(TicketStatus.Unclaimed, "Ongoing")]
    [InlineData(TicketStatus.Unclaimed, "Completed")]
    [InlineData(TicketStatus.Claimed, "Completed")]
    [InlineData(TicketStatus.Ongoing, "Claimed")]
    [InlineData(TicketStatus.Completed, "Ongoing")]
    [InlineData(TicketStatus.Completed, "Canceled")]
    [InlineData(TicketStatus.Canceled, "Claimed")]
    [InlineData(TicketStatus.Canceled, "Unclaimed")]
    public async Task ChangeStatus_rejects_invalid_transitions(TicketStatus from, string to)
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, from);
        var service = CreateService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ChangeStatusAsync(
                id, new ChangeTicketStatusDto(to), CancellationToken.None));
    }

    [Fact]
    public async Task ChangeStatus_throws_for_invalid_status_value()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.ChangeStatusAsync(
                id, new ChangeTicketStatusDto("Bogus"), CancellationToken.None));
    }

    [Fact]
    public async Task ChangeStatus_returns_null_for_missing_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ChangeStatusAsync(
            Guid.NewGuid(), new ChangeTicketStatusDto("Claimed"), CancellationToken.None);

        Assert.Null(result);
    }

    // --- Thin controller status-code tests ---

    [Fact]
    public async Task Controller_Claim_returns_ok()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);
        var controller = new TicketController(CreateService(context));

        var response = await controller.ClaimTicket(id, Amelia, CancellationToken.None);

        Assert.IsType<OkObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_Claim_returns_bad_request_on_conflict()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(
            context, TicketStatus.Claimed, assignedToId: "auth|noah");
        var controller = new TicketController(CreateService(context));

        var response = await controller.ClaimTicket(id, Amelia, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_Claim_returns_not_found_for_missing()
    {
        await using var context = CreateContext();
        var controller = new TicketController(CreateService(context));

        var response = await controller.ClaimTicket(Guid.NewGuid(), Amelia, CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public async Task Controller_Unclaim_returns_ok()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Claimed, assignedToId: "auth|amelia");
        var controller = new TicketController(CreateService(context));

        var response = await controller.UnclaimTicket(id, CancellationToken.None);

        Assert.IsType<OkObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_ChangeStatus_returns_bad_request_for_invalid_transition()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);
        var controller = new TicketController(CreateService(context));

        var response = await controller.ChangeStatus(
            id, new ChangeTicketStatusDto("Completed"), CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_ChangeStatus_returns_ok_for_valid_transition()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Claimed);
        var controller = new TicketController(CreateService(context));

        var response = await controller.ChangeStatus(
            id, new ChangeTicketStatusDto("Ongoing"), CancellationToken.None);

        Assert.IsType<OkObjectResult>(response.Result);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    // --- Cancellation attribution (CanceledBy) ---

    [Fact]
    public async Task Staff_cancel_records_the_actor_as_CanceledBy()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed);

        var result = await service.ChangeStatusAsync(
            id, new ChangeTicketStatusDto("Canceled"), CancellationToken.None,
            callerId: null, actorLabel: "Super Admin Alice");

        Assert.NotNull(result);
        Assert.Equal("Canceled", result!.Status);
        Assert.Equal("Super Admin Alice", result.CanceledBy);
        var stored = await context.Tickets.FindAsync(id);
        Assert.Equal("Super Admin Alice", stored!.CanceledBy);
    }

    [Fact]
    public async Task Non_cancel_transition_does_not_set_CanceledBy()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var id = await SeedTicketAsync(context, TicketStatus.Claimed);

        var result = await service.ChangeStatusAsync(
            id, new ChangeTicketStatusDto("Ongoing"), CancellationToken.None,
            callerId: null, actorLabel: "Super Admin Alice");

        Assert.NotNull(result);
        Assert.Null(result!.CanceledBy);
    }

    private TicketService CreateService(AppDbContext context)
    {
        return new TicketService(
            new TicketRepository(context), context, new Helpers.FakeConversationBroadcaster());
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

    private static async Task<Guid> SeedTicketAsync(
        AppDbContext context,
        TicketStatus status,
        string? assignedToId = null,
        string? assignedToName = null,
        string? assignedToEmail = null)
    {
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = "Test ticket",
            Status = status,
            WaitingOn = WaitingOn.None,
            AssignedToId = assignedToId,
            AssignedToName = assignedToName,
            AssignedToEmail = assignedToEmail,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        return ticket.Id;
    }
}
