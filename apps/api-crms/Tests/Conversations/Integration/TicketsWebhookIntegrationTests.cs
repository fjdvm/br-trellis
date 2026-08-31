using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// End-to-end HTTP verification for #122 (shop-chat Tickets webhook), driving the
/// real /api/v1/webhooks/tickets endpoint with genuinely HMAC-signed bodies. No live
/// caller required — this is the receiver's contract test.
/// </summary>
public sealed class TicketsWebhookIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;
    private readonly string _secret;

    public TicketsWebhookIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        _secret = config["Tickets:WebhookSecret"] ?? string.Empty;
        Assert.False(string.IsNullOrEmpty(_secret), "Tickets:WebhookSecret must be configured");
    }

    [Fact]
    public async Task Missing_signature_returns_401()
    {
        var body = BuildPayload("evt-1", "conv-1", "a@b.com", "Hi");
        var content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/v1/webhooks/tickets", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_signature_returns_401()
    {
        var body = BuildPayload("evt-1", "conv-1", "a@b.com", "Hi");

        var response = await PostSignedAsync(body, signatureOverride: "sha256=deadbeef");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Signed_message_creates_ecommerce_ticket_with_resolved_contact()
    {
        var email = $"shopper-{Guid.NewGuid():N}@example.com";
        var conv = $"conv-{Guid.NewGuid():N}";
        var response = await PostSignedAsync(
            BuildPayload($"evt-{Guid.NewGuid():N}", conv, email, "Where is my order?"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = db.Tickets.Single(t => t.ExternalThreadId == conv);
        Assert.Equal(TicketSource.Ecommerce, ticket.Source);
        Assert.NotNull(ticket.ContactId);
        var contact = db.Contacts.Single(c => c.Id == ticket.ContactId);
        Assert.Equal(email, contact.Email);
        var msg = db.Messages.Single(m => m.TicketId == ticket.Id);
        Assert.Equal(MessageSenderType.Contact, msg.SenderType);
        Assert.Equal("Where is my order?", msg.Content);
    }

    [Fact]
    public async Task Redelivery_of_same_event_id_does_not_duplicate()
    {
        var email = $"dup-{Guid.NewGuid():N}@example.com";
        var conv = $"conv-{Guid.NewGuid():N}";
        var eventId = $"evt-{Guid.NewGuid():N}";
        var body = BuildPayload(eventId, conv, email, "Hi");

        var first = await PostSignedAsync(body);
        var second = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticketIds = db.Tickets.Where(t => t.ExternalThreadId == conv).Select(t => t.Id).ToList();
        Assert.Single(ticketIds);
        Assert.Equal(1, db.Messages.Count(m => ticketIds.Contains(m.TicketId)));
    }

    [Fact]
    public async Task Subsequent_message_appends_to_existing_conversation()
    {
        var email = $"multi-{Guid.NewGuid():N}@example.com";
        var conv = $"conv-{Guid.NewGuid():N}";

        await PostSignedAsync(BuildPayload($"evt-{Guid.NewGuid():N}", conv, email, "First"));
        await PostSignedAsync(BuildPayload($"evt-{Guid.NewGuid():N}", conv, email, "Second"));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticketIds = db.Tickets.Where(t => t.ExternalThreadId == conv).Select(t => t.Id).ToList();
        Assert.Single(ticketIds);
        Assert.Equal(2, db.Messages.Count(m => ticketIds.Contains(m.TicketId)));
    }

    private async Task<HttpResponseMessage> PostSignedAsync(string body, string? signatureOverride = null)
    {
        var content = new StringContent(body, Encoding.UTF8, "application/json");
        var signature = signatureOverride ?? Sign(body, _secret);
        content.Headers.Add("X-Webhook-Signature", signature);
        return await _client.PostAsync("/api/v1/webhooks/tickets", content);
    }

    private static string Sign(string body, string secret)
    {
        var hash = HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(body));
        return "sha256=" + Convert.ToHexStringLower(hash);
    }

    private static string BuildPayload(
        string eventId, string conversationId, string email, string messageBody,
        string eventType = "ticket.message.received")
    {
        return JsonSerializer.Serialize(new
        {
            eventId,
            eventType,
            data = new
            {
                conversationId,
                customerEmail = email,
                customerName = "A Shopper",
                messageBody,
                subject = "Shop chat",
                occurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }
}
