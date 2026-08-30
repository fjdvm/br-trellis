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
/// End-to-end HTTP verification for #70 (WaitingOn independent of Status).
/// </summary>
public sealed class TicketWaitingOnIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public TicketWaitingOnIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Theory]
    [InlineData(TicketStatus.Unclaimed, "Agent")]
    [InlineData(TicketStatus.Claimed, "Customer")]
    [InlineData(TicketStatus.Ongoing, "None")]
    [InlineData(TicketStatus.Completed, "Customer")]
    public async Task SetWaitingOn_persists_across_status(TicketStatus status, string waitingOn)
    {
        var id = SeedTicket(status, WaitingOn.None);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{id}/waiting-on", new { waitingOn });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(waitingOn, body.GetProperty("waitingOn").GetString());
        Assert.Equal(status.ToString(), body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task SetWaitingOn_does_not_change_status_or_assignee()
    {
        // Owned by the caller so the owner-only guard permits the change.
        var id = SeedTicket(TicketStatus.Claimed, WaitingOn.None,
            assignedToId: "test-user-id", assignedToName: "Amelia", assignedToEmail: "amelia@trellis.io");

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{id}/waiting-on", new { waitingOn = "Customer" });

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Customer", body.GetProperty("waitingOn").GetString());
        Assert.Equal("Claimed", body.GetProperty("status").GetString());
        Assert.Equal("test-user-id", body.GetProperty("assignedToId").GetString());
        Assert.Equal("Amelia", body.GetProperty("assignedToName").GetString());
        Assert.Equal("amelia@trellis.io", body.GetProperty("assignedToEmail").GetString());
    }

    [Fact]
    public async Task Unclaimed_with_waitingon_agent_is_reachable()
    {
        var id = SeedTicket(TicketStatus.Unclaimed, WaitingOn.None);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{id}/waiting-on", new { waitingOn = "Agent" });

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Unclaimed", body.GetProperty("status").GetString());
        Assert.Equal("Agent", body.GetProperty("waitingOn").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("assignedToId").ValueKind);
    }

    [Fact]
    public async Task Invalid_waitingon_returns_400()
    {
        var id = SeedTicket(TicketStatus.Unclaimed, WaitingOn.None);
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{id}/waiting-on", new { waitingOn = "Nobody" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Missing_ticket_returns_404()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{Guid.NewGuid()}/waiting-on", new { waitingOn = "Agent" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private Guid SeedTicket(
        TicketStatus status,
        WaitingOn waitingOn,
        string? assignedToId = null,
        string? assignedToName = null,
        string? assignedToEmail = null)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = "WaitingOn ticket",
            Status = status,
            WaitingOn = waitingOn,
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
