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

    [Fact]
    public async Task Signed_order_without_contactId_resolves_contact_from_email()
    {
        // #121: an order carrying only a CustomerEmail (no ContactId) must still
        // land a Contact-linked Order, resolved via ContactIdentityService.
        var email = $"resolve-{Guid.NewGuid():N}@example.com";
        var eventId = $"evt-{Guid.NewGuid():N}";
        var body = BuildEmailOrderPayload(eventId, "order-int-email", email, 75.50m);

        var response = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var order = db.Orders.Single(o => o.PlatformOrderId == "order-int-email");
        var contact = db.Contacts.Single(c => c.Email == email);
        Assert.Equal(contact.Id, order.ContactId);
    }

    [Fact]
    public async Task Signed_customer_created_creates_contact_before_any_order()
    {
        // A new shop signup emits customer.created (email + name, no order). It must
        // surface as a CRM Contact immediately — this is the "signup reflects in CRM"
        // contract the shop relies on.
        var email = $"signup-{Guid.NewGuid():N}@example.com";
        var eventId = $"evt-{Guid.NewGuid():N}";
        var body = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "customer.created",
            Data = new
            {
                CustomerEmail = email,
                Name = "Signup Person",
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });

        var response = await PostSignedAsync(body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contact = db.Contacts.Single(c => c.Email == email);
        Assert.Equal("Signup Person", contact.Name);
        Assert.False(db.Orders.Any(), "no order should exist for a signup-only contact");
        Assert.True(db.ProcessedEvents.Any(e => e.EventId == eventId));
    }

    [Fact]
    public async Task Signed_customer_updated_overwrites_contact_name()
    {
        // A shopper editing their name in the shop emits customer.updated. The CRM
        // Contact's name must change to match — this is the "edit reflects in CRM"
        // contract.
        var email = $"editor-{Guid.NewGuid():N}@example.com";

        // First surface the contact via a signup (old name).
        var createBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = $"evt-{Guid.NewGuid():N}",
            EventType = "customer.created",
            Data = new { CustomerEmail = email, Name = "Old Name", OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });
        Assert.Equal(HttpStatusCode.OK, (await PostSignedAsync(createBody)).StatusCode);

        // Now the shopper renames themselves.
        var updateBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = $"evt-{Guid.NewGuid():N}",
            EventType = "customer.updated",
            Data = new { CustomerEmail = email, Name = "New Name", OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });
        var response = await PostSignedAsync(updateBody);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contact = db.Contacts.Single(c => c.Email == email);
        Assert.Equal("New Name", contact.Name);
        Assert.Equal(1, db.Contacts.Count(c => c.Email == email));
    }

    [Fact]
    public async Task Signed_customer_deleted_soft_deletes_the_contact()
    {
        var email = $"del-{Guid.NewGuid():N}@example.com";
        var createBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = $"evt-{Guid.NewGuid():N}",
            EventType = "customer.created",
            Data = new { CustomerEmail = email, Name = "To Delete", OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });
        Assert.Equal(HttpStatusCode.OK, (await PostSignedAsync(createBody)).StatusCode);

        var deleteBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = $"evt-{Guid.NewGuid():N}",
            EventType = "customer.deleted",
            Data = new { CustomerEmail = email, OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });
        Assert.Equal(HttpStatusCode.OK, (await PostSignedAsync(deleteBody)).StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contact = db.Contacts.Single(c => c.Email == email);
        Assert.NotNull(contact.DeletedAt);
    }

    [Fact]
    public async Task Signed_customer_event_resurrects_a_crm_deleted_contact()
    {
        // Deleted in the CRM (not in the shop): the next shop event brings it back.
        var email = $"res-{Guid.NewGuid():N}@example.com";
        var createBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = $"evt-{Guid.NewGuid():N}",
            EventType = "customer.created",
            Data = new { CustomerEmail = email, Name = "Comes Back", OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });
        Assert.Equal(HttpStatusCode.OK, (await PostSignedAsync(createBody)).StatusCode);

        // CRM-side soft delete (as if an agent deleted the contact in the CRM UI).
        Guid contactId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var contact = db.Contacts.Single(c => c.Email == email);
            contact.DeletedAt = DateTimeOffset.UtcNow;
            db.SaveChanges();
            contactId = contact.Id;
        }

        // A later shop event for the same customer.
        var updateBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = $"evt-{Guid.NewGuid():N}",
            EventType = "customer.updated",
            Data = new { CustomerEmail = email, Name = "Comes Back", OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });
        Assert.Equal(HttpStatusCode.OK, (await PostSignedAsync(updateBody)).StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var restored = verifyDb.Contacts.Single(c => c.Id == contactId);
        Assert.Null(restored.DeletedAt);
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

    private static string BuildEmailOrderPayload(
        string eventId, string orderId, string email, decimal total)
    {
        return System.Text.Json.JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "order.created",
            Data = new
            {
                OrderId = orderId,
                CustomerEmail = email,
                Status = "paid",
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
