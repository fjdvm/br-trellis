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

public sealed class TicketServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ticket-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task CreateTicket_defaults_to_unclaimed_and_waitingon_none()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreateTicketAsync(
            new CreateTicketDto("Cannot log in", null),
            CancellationToken.None);

        Assert.Equal("Cannot log in", result.Subject);
        Assert.Equal("Unclaimed", result.Status);
        Assert.Equal("None", result.WaitingOn);
        Assert.Null(result.ContactId);
        Assert.Null(result.Contact);
        Assert.Null(result.AssignedToId);
    }

    [Fact]
    public async Task CreateTicket_trims_subject()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreateTicketAsync(
            new CreateTicketDto("  Refund request  ", null),
            CancellationToken.None);

        Assert.Equal("Refund request", result.Subject);
    }

    [Fact]
    public async Task CreateTicket_with_linked_contact_returns_contact()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context, "Maya", "maya@acme.com");
        var service = CreateService(context);

        var result = await service.CreateTicketAsync(
            new CreateTicketDto("Order delayed", contactId),
            CancellationToken.None);

        Assert.Equal(contactId, result.ContactId);
        Assert.NotNull(result.Contact);
        Assert.Equal("Maya", result.Contact!.Name);
        Assert.Equal("maya@acme.com", result.Contact.Email);
    }

    [Fact]
    public async Task CreateTicket_throws_for_empty_subject()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateTicketAsync(
                new CreateTicketDto("", null),
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateTicket_throws_for_nonexistent_contact()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateTicketAsync(
                new CreateTicketDto("Ghost contact", Guid.NewGuid()),
                CancellationToken.None));
    }

    [Fact]
    public async Task GetTicketById_returns_null_for_missing()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.GetTicketByIdAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Ticket_with_null_contact_is_returned_normally()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var created = await service.CreateTicketAsync(
            new CreateTicketDto("Anonymous inbound", null),
            CancellationToken.None);

        var fetched = await service.GetTicketByIdAsync(created.Id, CancellationToken.None);

        Assert.NotNull(fetched);
        Assert.Null(fetched!.ContactId);
        Assert.Null(fetched.Contact);
    }

    [Fact]
    public async Task ListTickets_filters_by_status()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(context, "A", TicketStatus.Unclaimed, WaitingOn.None);
        await SeedTicketAsync(context, "B", TicketStatus.Claimed, WaitingOn.None);
        await SeedTicketAsync(context, "C", TicketStatus.Unclaimed, WaitingOn.Agent);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync("Unclaimed", null, null, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal("Unclaimed", t.Status));
    }

    [Fact]
    public async Task ListTickets_filters_by_waitingon()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(context, "A", TicketStatus.Unclaimed, WaitingOn.None);
        await SeedTicketAsync(context, "B", TicketStatus.Claimed, WaitingOn.Agent);
        await SeedTicketAsync(context, "C", TicketStatus.Unclaimed, WaitingOn.Agent);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync(null, "Agent", null, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal("Agent", t.WaitingOn));
    }

    [Fact]
    public async Task ListTickets_filters_by_status_and_waitingon_combined()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(context, "A", TicketStatus.Unclaimed, WaitingOn.None);
        await SeedTicketAsync(context, "B", TicketStatus.Unclaimed, WaitingOn.Agent);
        await SeedTicketAsync(context, "C", TicketStatus.Claimed, WaitingOn.Agent);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync("Unclaimed", "Agent", null, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("B", result[0].Subject);
    }

    [Fact]
    public async Task ListTickets_without_filters_returns_all()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(context, "A", TicketStatus.Unclaimed, WaitingOn.None);
        await SeedTicketAsync(context, "B", TicketStatus.Claimed, WaitingOn.Agent);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync(null, null, null, CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ListTickets_throws_for_invalid_status_filter()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.ListTicketsAsync("Bogus", null, null, CancellationToken.None));
    }

    [Fact]
    public async Task CreateTicket_stamps_source_manual()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreateTicketAsync(
            new CreateTicketDto("Opened by hand", null),
            CancellationToken.None);

        // A ticket opened via the New Ticket sheet is Manual, never Email.
        Assert.Equal("Manual", result.Source);
    }

    [Fact]
    public async Task ListTickets_filters_by_source()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(
            context, "Email one", TicketStatus.Unclaimed, WaitingOn.None, TicketSource.Email);
        await SeedTicketAsync(
            context, "Manual one", TicketStatus.Unclaimed, WaitingOn.None, TicketSource.Manual);
        await SeedTicketAsync(
            context, "Email two", TicketStatus.Claimed, WaitingOn.Agent, TicketSource.Email);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync(null, null, "Email", CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal("Email", t.Source));
    }

    [Fact]
    public async Task ListTickets_filters_by_source_manual()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(
            context, "Email one", TicketStatus.Unclaimed, WaitingOn.None, TicketSource.Email);
        await SeedTicketAsync(
            context, "Manual one", TicketStatus.Unclaimed, WaitingOn.None, TicketSource.Manual);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync(null, null, "Manual", CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("Manual one", result[0].Subject);
    }

    [Fact]
    public async Task ListTickets_without_source_returns_all_sources()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(
            context, "Email one", TicketStatus.Unclaimed, WaitingOn.None, TicketSource.Email);
        await SeedTicketAsync(
            context, "Manual one", TicketStatus.Unclaimed, WaitingOn.None, TicketSource.Manual);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync(null, null, null, CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ListTickets_combines_source_with_status_and_waitingon()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(
            context, "Match", TicketStatus.Unclaimed, WaitingOn.Agent, TicketSource.Manual);
        await SeedTicketAsync(
            context, "Wrong source", TicketStatus.Unclaimed, WaitingOn.Agent, TicketSource.Email);
        await SeedTicketAsync(
            context, "Wrong status", TicketStatus.Claimed, WaitingOn.Agent, TicketSource.Manual);
        var service = CreateService(context);

        var result = await service.ListTicketsAsync(
            "Unclaimed", "Agent", "Manual", CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("Match", result[0].Subject);
    }

    [Fact]
    public async Task ListTickets_throws_for_invalid_source_filter()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.ListTicketsAsync(null, null, "Bogus", CancellationToken.None));
    }

    [Fact]
    public async Task TicketController_ListTickets_returns_ok()
    {
        await using var context = CreateContext();
        await SeedTicketAsync(context, "A", TicketStatus.Unclaimed, WaitingOn.None);
        var service = CreateService(context);
        var controller = new TicketController(service);

        var response = await controller.ListTickets(null, null, null, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<TicketListItemDto>>(result.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task TicketController_ListTickets_returns_bad_request_for_invalid_filter()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new TicketController(service);

        var response = await controller.ListTickets("Nope", null, null, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Fact]
    public async Task TicketController_GetTicket_returns_not_found_for_missing()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new TicketController(service);

        var response = await controller.GetTicket(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public async Task TicketController_CreateTicket_returns_created()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new TicketController(service);

        var response = await controller.CreateTicket(
            new CreateTicketDto("New issue", null),
            CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(response.Result);
        var dto = Assert.IsType<TicketDetailDto>(created.Value);
        Assert.Equal("New issue", dto.Subject);
    }

    [Fact]
    public async Task TicketController_CreateTicket_returns_bad_request_for_empty_subject()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new TicketController(service);

        var response = await controller.CreateTicket(
            new CreateTicketDto("", null),
            CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private TicketService CreateService(AppDbContext context)
    {
        return new TicketService(new TicketRepository(context), context);
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

    private static async Task<Guid> SeedContactAsync(AppDbContext context, string name, string email)
    {
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();
        return contact.Id;
    }

    private static async Task SeedTicketAsync(
        AppDbContext context, string subject, TicketStatus status, WaitingOn waitingOn,
        TicketSource source = TicketSource.Email)
    {
        context.Tickets.Add(new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = subject,
            Status = status,
            WaitingOn = waitingOn,
            Source = source,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();
    }
}
