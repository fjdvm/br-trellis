using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// End-to-end HTTP verification for #69 (claim / unclaim / status transitions).
/// </summary>
public sealed class TicketClaimTransitionIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    private static readonly object Amelia =
        new { staffId = "auth|amelia", staffName = "Amelia Ward", staffEmail = "amelia@trellis.io" };

    public TicketClaimTransitionIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Claim_from_unclaimed_sets_assignee_and_status()
    {
        var id = SeedTicket(TicketStatus.Unclaimed);

        var response = await _client.PostAsJsonAsync($"/api/v1/tickets/{id}/claim", Amelia);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Claimed", body.GetProperty("status").GetString());
        Assert.Equal("auth|amelia", body.GetProperty("assignedToId").GetString());
        Assert.Equal("Amelia Ward", body.GetProperty("assignedToName").GetString());
        Assert.Equal("amelia@trellis.io", body.GetProperty("assignedToEmail").GetString());
    }

    [Fact]
    public async Task Claim_from_ongoing_with_null_assignee_succeeds()
    {
        var id = SeedTicket(TicketStatus.Ongoing, assignedToId: null);

        var response = await _client.PostAsJsonAsync($"/api/v1/tickets/{id}/claim", Amelia);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Claimed", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Claim_already_owned_returns_400_without_side_effects()
    {
        var id = SeedTicket(TicketStatus.Claimed, assignedToId: "auth|noah", assignedToName: "Noah");

        var response = await _client.PostAsJsonAsync($"/api/v1/tickets/{id}/claim", Amelia);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        // Original assignment untouched
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = db.Tickets.Find(id);
        Assert.Equal("auth|noah", ticket!.AssignedToId);
        Assert.Equal(TicketStatus.Claimed, ticket.Status);
    }

    [Fact]
    public async Task Claim_missing_ticket_returns_404()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{Guid.NewGuid()}/claim", Amelia);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Unclaim_from_claimed_clears_assignee_and_returns_unclaimed()
    {
        var id = SeedTicket(TicketStatus.Claimed, assignedToId: "auth|amelia",
            assignedToName: "Amelia", assignedToEmail: "amelia@trellis.io");

        var response = await _client.PostAsync($"/api/v1/tickets/{id}/unclaim", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unclaimed", body.GetProperty("status").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("assignedToId").ValueKind);
        Assert.Equal(JsonValueKind.Null, body.GetProperty("assignedToName").ValueKind);
        Assert.Equal(JsonValueKind.Null, body.GetProperty("assignedToEmail").ValueKind);
    }

    [Fact]
    public async Task Unclaim_from_unclaimed_returns_400()
    {
        var id = SeedTicket(TicketStatus.Unclaimed);
        var response = await _client.PostAsync($"/api/v1/tickets/{id}/unclaim", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Unclaim_missing_ticket_returns_404()
    {
        var response = await _client.PostAsync($"/api/v1/tickets/{Guid.NewGuid()}/unclaim", null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(TicketStatus.Unclaimed, "Claimed")]
    [InlineData(TicketStatus.Claimed, "Ongoing")]
    [InlineData(TicketStatus.Ongoing, "Completed")]
    [InlineData(TicketStatus.Unclaimed, "Canceled")]
    [InlineData(TicketStatus.Claimed, "Canceled")]
    [InlineData(TicketStatus.Ongoing, "Canceled")]
    public async Task Status_valid_transitions_return_ok(TicketStatus from, string to)
    {
        var id = SeedTicket(from);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{id}/status", new { status = to });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(to, body.GetProperty("status").GetString());
    }

    [Theory]
    [InlineData(TicketStatus.Unclaimed, "Completed")]
    [InlineData(TicketStatus.Ongoing, "Claimed")]
    [InlineData(TicketStatus.Completed, "Ongoing")]
    [InlineData(TicketStatus.Completed, "Canceled")]
    [InlineData(TicketStatus.Canceled, "Unclaimed")]
    public async Task Status_invalid_transitions_return_400(TicketStatus from, string to)
    {
        var id = SeedTicket(from);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{id}/status", new { status = to });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Status_missing_ticket_returns_404()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{Guid.NewGuid()}/status", new { status = "Claimed" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Assignee_snapshot_stable_on_reread()
    {
        var id = SeedTicket(TicketStatus.Unclaimed);
        await _client.PostAsJsonAsync($"/api/v1/tickets/{id}/claim", Amelia);

        var response = await _client.GetAsync($"/api/v1/tickets/{id}");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("auth|amelia", body.GetProperty("assignedToId").GetString());
        Assert.Equal("Amelia Ward", body.GetProperty("assignedToName").GetString());
        Assert.Equal("amelia@trellis.io", body.GetProperty("assignedToEmail").GetString());
    }

    private Guid SeedTicket(
        TicketStatus status,
        string? assignedToId = null,
        string? assignedToName = null,
        string? assignedToEmail = null)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = "Claim/transition ticket",
            Status = status,
            WaitingOn = WaitingOn.None,
            AssignedToId = assignedToId,
            AssignedToName = assignedToName,
            AssignedToEmail = assignedToEmail,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Tickets.Add(ticket);
        db.SaveChanges();
        return ticket.Id;
    }
}
