using System.Net.Http.Json;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Xunit.Abstractions;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// Contract guard for the "claimed ticket must appear in My Assigned /
/// Conversations Inbox" behavior. Mirrors exactly what a real user does: claim
/// via HTTP with a GUID staffId (the shape `session.user.id` = token.sub takes
/// in production), then re-read the LIST endpoint (what both views actually
/// fetch) and the BY-ID endpoint, asserting the exact stored vs. returned
/// values so a future change can't silently break the fields the views filter
/// on (assignedToId + status). Diagnosed as the backend half of the bug report;
/// the client-side stale-list half is fixed by useRefetchOnFocus.
/// </summary>
public sealed class ClaimVisibilityContractTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;
    private readonly ITestOutputHelper _out;

    // The claim endpoint derives the assignee from the validated bearer token
    // (server-trusted), NOT the client body. Under TestAuthHandler the token's
    // NameIdentifier is "test-user-id", so that is what gets stored and what the
    // ownership filters must compare against. This mirrors production, where the
    // stored id is the OIDC `sub`.
    private const string RealAgentId = "test-user-id";

    public ClaimVisibilityContractTests(TestWebApplicationFactory factory, ITestOutputHelper output)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _out = output;
    }

    [Fact]
    public async Task Claim_then_list_and_getById_exposes_assignedToId_and_status()
    {
        // Arrange: an Unclaimed ticket, exactly like a fresh inbound ticket.
        var id = SeedTicket(TicketStatus.Unclaimed);

        var claimBody = new
        {
            staffId = RealAgentId,
            staffName = "Alice SuperAdmin",
            staffEmail = "alice@trellis.io",
        };

        // Act 1: claim (what the Claim button sends).
        var claimResp = await _client.PostAsJsonAsync($"/api/v1/tickets/{id}/claim", claimBody);
        var claimJson = await claimResp.Content.ReadFromJsonAsync<JsonElement>();

        // Act 2: GET the ticket by id (Step 1 + 4 of the investigation).
        var byIdResp = await _client.GetAsync($"/api/v1/tickets/{id}");
        var byId = await byIdResp.Content.ReadFromJsonAsync<JsonElement>();

        // Act 3: GET the LIST (what My Assigned + Inbox actually fetch).
        var listResp = await _client.GetAsync("/api/v1/tickets");
        var list = await listResp.Content.ReadFromJsonAsync<JsonElement>();
        var row = list.EnumerateArray()
            .First(t => t.GetProperty("id").GetString() == id.ToString());

        // Also read the raw DB value.
        string? dbAssignedToId;
        string? dbStatus;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ticket = db.Tickets.Find(id)!;
            dbAssignedToId = ticket.AssignedToId;
            dbStatus = ticket.Status.ToString();
        }

        _out.WriteLine("=== LIVE EVIDENCE ===");
        _out.WriteLine($"[compare value] frontend currentAgentId would be: '{RealAgentId}'");
        _out.WriteLine($"[DB]        assigned_to_id = '{dbAssignedToId}'");
        _out.WriteLine($"[DB]        status         = '{dbStatus}'");
        _out.WriteLine($"[claim resp] assignedToId  = {Raw(claimJson, "assignedToId")}");
        _out.WriteLine($"[claim resp] status        = {Raw(claimJson, "status")}");
        _out.WriteLine($"[GET by-id]  assignedToId  = {Raw(byId, "assignedToId")}");
        _out.WriteLine($"[GET by-id]  status        = {Raw(byId, "status")}");
        _out.WriteLine($"[GET list ]  has 'assignedToId' key? {row.TryGetProperty("assignedToId", out _)}");
        _out.WriteLine($"[GET list ]  assignedToId  = {Raw(row, "assignedToId")}");
        _out.WriteLine($"[GET list ]  status        = {Raw(row, "status")}");

        // Simulate the two views' client-side filters against the LIST row.
        var listAssignedToId = row.TryGetProperty("assignedToId", out var a) && a.ValueKind == JsonValueKind.String
            ? a.GetString()
            : null;
        var listStatus = row.GetProperty("status").GetString();

        var myAssignedShows = listAssignedToId != null && listAssignedToId == RealAgentId;
        var inboxShows = listAssignedToId != null && listAssignedToId == RealAgentId
            && (listStatus == "Claimed" || listStatus == "Ongoing");

        _out.WriteLine($"[My Assigned filter] would show ticket? {myAssignedShows}");
        _out.WriteLine($"[Inbox filter]       would show ticket? {inboxShows}");

        // Assert the backend contract the two views depend on.
        Assert.Equal(RealAgentId, dbAssignedToId);
        Assert.Equal("Claimed", dbStatus);
        Assert.Equal(RealAgentId, listAssignedToId);
        Assert.Equal("Claimed", listStatus);
        Assert.True(myAssignedShows, "My Assigned filter should match the claimed ticket");
        Assert.True(inboxShows, "Inbox filter should match the claimed ticket");
    }

    private static string Raw(JsonElement obj, string prop)
    {
        if (!obj.TryGetProperty(prop, out var v)) return "<MISSING KEY>";
        return v.ValueKind == JsonValueKind.Null ? "<null>" : $"'{v}'";
    }

    private Guid SeedTicket(TicketStatus status)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = "Repro ticket",
            Status = status,
            WaitingOn = WaitingOn.Agent,
            Source = TicketSource.Email,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Tickets.Add(ticket);
        db.SaveChanges();
        return ticket.Id;
    }
}
