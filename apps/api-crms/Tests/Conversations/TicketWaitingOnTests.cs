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

public sealed class TicketWaitingOnTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ticket-waitingon-{Guid.NewGuid():N}.db");

    [Theory]
    [InlineData(TicketStatus.Unclaimed, "Agent")]
    [InlineData(TicketStatus.Unclaimed, "Customer")]
    [InlineData(TicketStatus.Claimed, "Customer")]
    [InlineData(TicketStatus.Ongoing, "Agent")]
    [InlineData(TicketStatus.Completed, "None")]
    [InlineData(TicketStatus.Canceled, "None")]
    public async Task SetWaitingOn_persists_across_every_status(TicketStatus status, string waitingOn)
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, status, WaitingOn.None);
        var service = CreateService(context);

        var result = await service.SetWaitingOnAsync(
            id, new SetWaitingOnDto(waitingOn), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(waitingOn, result!.WaitingOn);
        // Status is untouched
        Assert.Equal(status.ToString(), result.Status);
    }

    [Fact]
    public async Task SetWaitingOn_does_not_change_status_or_assignee()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(
            context, TicketStatus.Claimed, WaitingOn.None,
            assignedToId: "auth|amelia",
            assignedToName: "Amelia Ward",
            assignedToEmail: "amelia@trellis.io");
        var service = CreateService(context);

        var result = await service.SetWaitingOnAsync(
            id, new SetWaitingOnDto("Customer"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Customer", result!.WaitingOn);
        Assert.Equal("Claimed", result.Status);
        Assert.Equal("auth|amelia", result.AssignedToId);
        Assert.Equal("Amelia Ward", result.AssignedToName);
        Assert.Equal("amelia@trellis.io", result.AssignedToEmail);

        // Verify at the persistence layer too
        context.ChangeTracker.Clear();
        var persisted = await context.Tickets.FindAsync(id);
        Assert.Equal(WaitingOn.Customer, persisted!.WaitingOn);
        Assert.Equal(TicketStatus.Claimed, persisted.Status);
        Assert.Equal("auth|amelia", persisted.AssignedToId);
    }

    [Fact]
    public async Task Unclaimed_with_waitingon_agent_is_reachable()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed, WaitingOn.None);
        var service = CreateService(context);

        var result = await service.SetWaitingOnAsync(
            id, new SetWaitingOnDto("Agent"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Unclaimed", result!.Status);
        Assert.Equal("Agent", result.WaitingOn);
        Assert.Null(result.AssignedToId);
    }

    [Fact]
    public async Task Null_assignee_with_waitingon_agent_is_reachable()
    {
        await using var context = CreateContext();
        // Ongoing with no assignee — an unusual but valid combination.
        var id = await SeedTicketAsync(context, TicketStatus.Ongoing, WaitingOn.None);
        var service = CreateService(context);

        var result = await service.SetWaitingOnAsync(
            id, new SetWaitingOnDto("Agent"), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Agent", result!.WaitingOn);
        Assert.Null(result.AssignedToId);
    }

    [Fact]
    public async Task SetWaitingOn_throws_for_invalid_value()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed, WaitingOn.None);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.SetWaitingOnAsync(
                id, new SetWaitingOnDto("Nobody"), CancellationToken.None));
    }

    [Fact]
    public async Task SetWaitingOn_returns_null_for_missing_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.SetWaitingOnAsync(
            Guid.NewGuid(), new SetWaitingOnDto("Agent"), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Controller_SetWaitingOn_returns_ok()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed, WaitingOn.None);
        var controller = new TicketController(CreateService(context));

        var response = await controller.SetWaitingOn(
            id, new SetWaitingOnDto("Agent"), CancellationToken.None);

        Assert.IsType<OkObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_SetWaitingOn_returns_bad_request_for_invalid_value()
    {
        await using var context = CreateContext();
        var id = await SeedTicketAsync(context, TicketStatus.Unclaimed, WaitingOn.None);
        var controller = new TicketController(CreateService(context));

        var response = await controller.SetWaitingOn(
            id, new SetWaitingOnDto("Nobody"), CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_SetWaitingOn_returns_not_found_for_missing()
    {
        await using var context = CreateContext();
        var controller = new TicketController(CreateService(context));

        var response = await controller.SetWaitingOn(
            Guid.NewGuid(), new SetWaitingOnDto("Agent"), CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
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
        WaitingOn waitingOn,
        string? assignedToId = null,
        string? assignedToName = null,
        string? assignedToEmail = null)
    {
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = "Test ticket",
            Status = status,
            WaitingOn = waitingOn,
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
