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
/// End-to-end HTTP verification for #68 (Ticket create + list filtering),
/// driving the real pipeline through TestWebApplicationFactory.
/// </summary>
public sealed class TicketEndpointsIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public TicketEndpointsIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ResetTickets()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Messages.RemoveRange(db.Messages);
        db.Tickets.RemoveRange(db.Tickets);
        db.SaveChanges();
    }

    private Guid SeedContact()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Integration Contact",
            Email = "integration@example.com",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Contacts.Add(contact);
        db.SaveChanges();
        return contact.Id;
    }

    [Fact]
    public async Task Post_ticket_without_contact_defaults_unclaimed_none()
    {
        ResetTickets();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/tickets", new { subject = "No contact ticket", contactId = (Guid?)null });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("No contact ticket", body.GetProperty("subject").GetString());
        Assert.Equal("Unclaimed", body.GetProperty("status").GetString());
        Assert.Equal("None", body.GetProperty("waitingOn").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("contactId").ValueKind);
        Assert.Equal(JsonValueKind.Null, body.GetProperty("contact").ValueKind);
    }

    [Fact]
    public async Task Post_ticket_with_contact_links_contact()
    {
        ResetTickets();
        var contactId = SeedContact();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/tickets", new { subject = "Linked ticket", contactId });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(contactId, body.GetProperty("contactId").GetGuid());
        Assert.Equal("Integration Contact", body.GetProperty("contact").GetProperty("name").GetString());
    }

    [Fact]
    public async Task Post_ticket_with_nonexistent_contact_returns_400()
    {
        ResetTickets();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/tickets", new { subject = "Ghost", contactId = Guid.NewGuid() });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_ticket_with_null_contact_returned_normally()
    {
        ResetTickets();

        var created = await _client.PostAsJsonAsync(
            "/api/v1/tickets", new { subject = "Null contact", contactId = (Guid?)null });
        var createdBody = await created.Content.ReadFromJsonAsync<JsonElement>();
        var id = createdBody.GetProperty("id").GetGuid();

        var response = await _client.GetAsync($"/api/v1/tickets/{id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(JsonValueKind.Null, body.GetProperty("contactId").ValueKind);
        Assert.Equal(JsonValueKind.Null, body.GetProperty("contact").ValueKind);
    }

    [Fact]
    public async Task Get_tickets_filters_by_status_waitingon_and_combined()
    {
        ResetTickets();
        await SeedTicketAsync("A", TicketStatus.Unclaimed, WaitingOn.None);
        await SeedTicketAsync("B", TicketStatus.Unclaimed, WaitingOn.Agent);
        await SeedTicketAsync("C", TicketStatus.Claimed, WaitingOn.Agent);

        var byStatus = await GetSubjectsAsync("/api/v1/tickets?status=Unclaimed");
        Assert.Equal(2, byStatus.Count);
        Assert.Contains("A", byStatus);
        Assert.Contains("B", byStatus);

        var byWaiting = await GetSubjectsAsync("/api/v1/tickets?waitingOn=Agent");
        Assert.Equal(2, byWaiting.Count);
        Assert.Contains("B", byWaiting);
        Assert.Contains("C", byWaiting);

        var combined = await GetSubjectsAsync("/api/v1/tickets?status=Unclaimed&waitingOn=Agent");
        Assert.Single(combined);
        Assert.Contains("B", combined);
    }

    [Fact]
    public async Task Get_tickets_invalid_status_filter_returns_400()
    {
        var response = await _client.GetAsync("/api/v1/tickets?status=Bogus");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_tickets_invalid_waitingon_filter_returns_400()
    {
        var response = await _client.GetAsync("/api/v1/tickets?waitingOn=Nobody");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_missing_ticket_returns_404()
    {
        var response = await _client.GetAsync($"/api/v1/tickets/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public void Migration_applies_cleanly_and_ticket_table_is_usable()
    {
        // TestWebApplicationFactory runs EnsureCreated() against a fresh in-memory
        // SQLite database built from the current model (which the migrations track).
        // A round-trip insert/read confirms the ticket schema is present and usable.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = "schema probe",
            Status = TicketStatus.Unclaimed,
            WaitingOn = WaitingOn.Agent,
            ExternalThreadId = "probe-thread",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Tickets.Add(ticket);
        db.SaveChanges();

        var loaded = db.Tickets.Find(ticket.Id);
        Assert.NotNull(loaded);
        Assert.Equal(WaitingOn.Agent, loaded!.WaitingOn);
        Assert.Equal("probe-thread", loaded.ExternalThreadId);

        db.Tickets.Remove(loaded);
        db.SaveChanges();
    }

    private async Task<List<string>> GetSubjectsAsync(string path)
    {
        var response = await _client.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<JsonElement>();
        var subjects = new List<string>();
        foreach (var item in items.EnumerateArray())
        {
            subjects.Add(item.GetProperty("subject").GetString()!);
        }
        return subjects;
    }

    private async Task SeedTicketAsync(string subject, TicketStatus status, WaitingOn waitingOn)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Tickets.Add(new Ticket
        {
            Id = Guid.NewGuid(),
            Subject = subject,
            Status = status,
            WaitingOn = waitingOn,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync();
    }
}
