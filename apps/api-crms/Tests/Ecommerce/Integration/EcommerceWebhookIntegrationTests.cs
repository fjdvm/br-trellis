using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Ecommerce.Integration;

/// <summary>
/// End-to-end HTTP verification for #28 (ecommerce webhook ingestion), driving the
/// real /api/v1/webhooks/ecommerce endpoint with genuinely HMAC-signed bodies.
/// </summary>
public sealed class EcommerceWebhookIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;
    private readonly string _secret;

    public EcommerceWebhookIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();

        using var scope = _factory.Services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        _secret = config["Ecommerce:WebhookSecret"] ?? string.Empty;
        Assert.False(string.IsNullOrEmpty(_secret));
    }

    [Fact]
    public async Task Unsigned_request_returns_401()
    {
        var body = "{\"EventId\":\"test-1\",\"EventType\":\"order.created\",\"Data\":{}}";
        var content = new StringContent(body, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/v1/webhooks/ecommerce", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_signature_returns_401()
    {
        var body = "{\"EventId\":\"test-2\",\"EventType\":\"order.created\",\"Data\":{}}";
        var content = new StringContent(body, Encoding.UTF8, "application/json");
        content.Headers.Add("X-Webhook-Signature", "sha256=deadbeef");

        var response = await _client.PostAsync("/api/v1/webhooks/ecommerce", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Signed_order_created_is_accepted_and_projects_order()
    {
        var contactId = SeedContact();
        var eventId = $"evt-{Guid.NewGuid():N}";
        var body = BuildOrderPayload(eventId, "order-int-1", contactId, "paid", 149.99m);

        var response = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var order = db.Orders.Single(o => o.PlatformOrderId == "order-int-1");
        Assert.Equal(contactId, order.ContactId);
        Assert.Equal(OrderStatus.Paid, order.Status);
        Assert.Equal(149.99m, order.Total);
        Assert.True(db.ProcessedEvents.Any(e => e.EventId == eventId));
    }

    [Fact]
    public async Task Duplicate_event_id_is_acknowledged_and_not_reprocessed()
    {
        var contactId = SeedContact();
        var eventId = $"evt-{Guid.NewGuid():N}";
        var body = BuildOrderPayload(eventId, "order-int-dup", contactId, "paid", 50m);

        var first = await PostSignedAsync(body);
        var second = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode); // acknowledged even on dedup

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(1, db.Orders.Count(o => o.PlatformOrderId == "order-int-dup"));
    }

    private async Task<HttpResponseMessage> PostSignedAsync(string body)
    {
        var content = new StringContent(body, Encoding.UTF8, "application/json");
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(_secret), Encoding.UTF8.GetBytes(body));
        content.Headers.Add("X-Webhook-Signature", "sha256=" + Convert.ToHexStringLower(hash));
        return await _client.PostAsync("/api/v1/webhooks/ecommerce", content);
    }

    private static string BuildOrderPayload(
        string eventId, string orderId, Guid contactId, string status, decimal total)
    {
        return System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "order.created",
            Data = new
            {
                OrderId = orderId,
                ContactId = contactId.ToString(),
                Status = status,
                Total = total,
                RefundedAmount = 0m,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
                LineItems = new[]
                {
                    new { ProductId = "prod-1", ProductName = "Widget", Quantity = 1, UnitPrice = total },
                },
            },
        });
    }

    private Guid SeedContact()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Webhook Contact",
            Email = $"wh-{Guid.NewGuid():N}@example.com",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Contacts.Add(contact);
        db.SaveChanges();
        return contact.Id;
    }
}
