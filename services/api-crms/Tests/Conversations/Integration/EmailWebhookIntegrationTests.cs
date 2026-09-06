using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// End-to-end HTTP verification for #72 (email ingestion webhook), driving the
/// real /api/v1/webhooks/email endpoint with genuinely HMAC-signed bodies.
/// </summary>
public sealed class EmailWebhookIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;
    private readonly string _secret;

    public EmailWebhookIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        _secret = config["Email:WebhookSecret"] ?? string.Empty;
        Assert.False(string.IsNullOrEmpty(_secret), "Email:WebhookSecret must be configured for the test");
    }

    private void ResetTickets()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Messages.RemoveRange(db.Messages);
        db.Tickets.RemoveRange(db.Tickets);
        db.ProcessedEvents.RemoveRange(db.ProcessedEvents);
        db.SaveChanges();
    }

    private async Task<HttpResponseMessage> PostSignedAsync(string body, string? signatureOverride = null)
    {
        var content = new StringContent(body, Encoding.UTF8, "application/json");
        var signature = signatureOverride ?? Sign(body, _secret);
        content.Headers.Add("X-Webhook-Signature", signature);
        return await _client.PostAsync("/api/v1/webhooks/email", content);
    }

    private static string Sign(string body, string secret)
    {
        var hash = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body));
        return "sha256=" + Convert.ToHexStringLower(hash);
    }

    private static string BuildPayload(
        string eventId, string threadId, string subject, string body,
        Guid? contactId = null, string eventType = "email.received")
    {
        return JsonSerializer.Serialize(new
        {
            eventId,
            eventType,
            data = new
            {
                threadId,
                subject,
                fromEmail = "customer@example.com",
                fromName = "A Customer",
                body,
                contactId,
                occurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }

    private (int tickets, int messages) Counts(string threadId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tickets = db.Tickets.Count(t => t.ExternalThreadId == threadId);
        var ticketIds = db.Tickets.Where(t => t.ExternalThreadId == threadId).Select(t => t.Id).ToList();
        var messages = db.Messages.Count(m => ticketIds.Contains(m.TicketId));
        return (tickets, messages);
    }

    [Fact]
    public async Task Missing_signature_returns_401()
    {
        ResetTickets();
        var body = BuildPayload("evt-1", "thread-1", "S", "B");
        var content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/v1/webhooks/email", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_signature_returns_401()
    {
        ResetTickets();
        var body = BuildPayload("evt-1", "thread-1", "S", "B");

        var response = await PostSignedAsync(body, signatureOverride: "sha256=deadbeef");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task New_inbound_email_creates_unclaimed_agent_ticket_with_contact_message()
    {
        ResetTickets();
        var body = BuildPayload("evt-new", "thread-new", "Help", "Nothing works");

        var response = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = db.Tickets.Single(t => t.ExternalThreadId == "thread-new");
        Assert.Equal(TicketStatus.Unclaimed, ticket.Status);
        Assert.Equal(WaitingOn.Agent, ticket.WaitingOn);
        Assert.Null(ticket.ContactId);
        var msg = db.Messages.Single(m => m.TicketId == ticket.Id);
        Assert.Equal(MessageSenderType.Contact, msg.SenderType);
        Assert.Equal("Nothing works", msg.Content);
    }

    [Fact]
    public async Task Matching_thread_appends_message_without_duplicate_ticket()
    {
        ResetTickets();
        await PostSignedAsync(BuildPayload("evt-a", "thread-dup", "S", "First"));
        await PostSignedAsync(BuildPayload("evt-b", "thread-dup", "S", "Second"));

        var (tickets, messages) = Counts("thread-dup");
        Assert.Equal(1, tickets);
        Assert.Equal(2, messages);
    }

    [Fact]
    public async Task Reply_on_existing_thread_sets_waiting_on_agent_without_changing_status()
    {
        ResetTickets();
        await PostSignedAsync(BuildPayload("evt-a", "thread-reply", "S", "First"));

        // Agent claims and marks waiting on customer.
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var t = db.Tickets.Single(x => x.ExternalThreadId == "thread-reply");
            t.Status = TicketStatus.Claimed;
            t.WaitingOn = WaitingOn.Customer;
            db.SaveChanges();
        }

        await PostSignedAsync(BuildPayload("evt-b", "thread-reply", "S", "Customer reply"));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var t = db.Tickets.Single(x => x.ExternalThreadId == "thread-reply");
            Assert.Equal(WaitingOn.Agent, t.WaitingOn);
            Assert.Equal(TicketStatus.Claimed, t.Status);
        }
    }

    [Fact]
    public async Task Duplicate_event_id_is_a_no_op()
    {
        ResetTickets();
        var body = BuildPayload("evt-dupe", "thread-x", "S", "Body");

        var first = await PostSignedAsync(body);
        var second = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var (tickets, messages) = Counts("thread-x");
        Assert.Equal(1, tickets);
        Assert.Equal(1, messages);
    }

    [Fact]
    public async Task Known_contact_links_ticket_and_message()
    {
        ResetTickets();
        Guid contactId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var contact = new Contact
            {
                Id = Guid.NewGuid(),
                Name = "Known",
                Email = "known@example.com",
                CreatedAt = DateTimeOffset.UtcNow,
            };
            db.Contacts.Add(contact);
            db.SaveChanges();
            contactId = contact.Id;
        }

        await PostSignedAsync(BuildPayload("evt-known", "thread-known", "S", "Body", contactId));

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ticket = db.Tickets.Single(t => t.ExternalThreadId == "thread-known");
            Assert.Equal(contactId, ticket.ContactId);
            var msg = db.Messages.Single(m => m.TicketId == ticket.Id);
            Assert.Equal(contactId, msg.SenderContactId);
        }
    }

    [Fact]
    public async Task Unknown_contact_is_ignored_ticket_stays_unlinked()
    {
        ResetTickets();
        await PostSignedAsync(
            BuildPayload("evt-unk", "thread-unk", "S", "Body", contactId: Guid.NewGuid()));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = db.Tickets.Single(t => t.ExternalThreadId == "thread-unk");
        Assert.Null(ticket.ContactId);
    }

    [Fact]
    public async Task Unknown_event_type_persists_nothing()
    {
        ResetTickets();
        var body = BuildPayload("evt-bad", "thread-bad", "S", "Body", eventType: "email.bounced");

        // Signature is valid, but the event type is unknown -> the ingestion service throws
        // and its transaction rolls back. The webhook has no error-handling middleware, so
        // the failure surfaces as an exception at the pipeline boundary. The acceptance
        // criterion is that NOTHING is persisted (rollback) — assert that here.
        await Assert.ThrowsAnyAsync<Exception>(() => PostSignedAsync(body));

        var (tickets, messages) = Counts("thread-bad");
        Assert.Equal(0, tickets);
        Assert.Equal(0, messages);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(db.ProcessedEvents.Any(e => e.EventId == "evt-bad"));
    }

    [Fact]
    public async Task Missing_body_persists_nothing()
    {
        ResetTickets();
        var body = BuildPayload("evt-nobody", "thread-nobody", "S", body: "");

        await Assert.ThrowsAnyAsync<Exception>(() => PostSignedAsync(body));

        var (tickets, _) = Counts("thread-nobody");
        Assert.Equal(0, tickets);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(db.ProcessedEvents.Any(e => e.EventId == "evt-nobody"));
    }
}
