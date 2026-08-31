using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

/// <summary>
/// Covers #121: <see cref="EcommerceIngestionService"/> resolving the Contact via
/// <see cref="ContactIdentityService"/> when an order event carries no ContactId
/// but does carry a CustomerEmail. Existing ContactId-present behaviour must stay
/// unchanged.
/// </summary>
public sealed class EcommerceIngestionContactResolutionTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ecommerce-resolve-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Order_without_contactId_resolves_new_contact_from_customer_email()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = OrderPayloadWithEmail("evt-1", "order-500", "buyer@example.com", 120.00m);

        var processed = await service.ProcessEventAsync("evt-1", "order.created", payload);

        Assert.True(processed);
        var order = await context.Orders.SingleAsync();
        Assert.Equal("order-500", order.PlatformOrderId);

        // A Contact was created and the order is linked to it.
        var contact = await context.Contacts.SingleAsync();
        Assert.Equal("buyer@example.com", contact.Email);
        Assert.Equal(contact.Id, order.ContactId);
    }

    [Fact]
    public async Task Order_without_contactId_matches_existing_contact_by_email()
    {
        await using var context = CreateContext();
        var existingId = await SeedContactAsync(context, "returning@example.com");
        var service = CreateService(context);

        var payload = OrderPayloadWithEmail("evt-1", "order-501", "returning@example.com", 80.00m);

        await service.ProcessEventAsync("evt-1", "order.created", payload);

        // No duplicate contact; order links to the existing one.
        Assert.Equal(1, await context.Contacts.CountAsync());
        var order = await context.Orders.SingleAsync();
        Assert.Equal(existingId, order.ContactId);
    }

    [Fact]
    public async Task Order_with_explicit_contactId_ignores_email_and_uses_contactId()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context, "known@example.com");
        var service = CreateService(context);

        // ContactId present AND a different email — ContactId must win, unchanged behaviour.
        var payload = JsonSerializer.Serialize(new
        {
            EventId = "evt-1",
            EventType = "order.created",
            Data = new
            {
                OrderId = "order-502",
                ContactId = contactId.ToString(),
                CustomerEmail = "someone-else@example.com",
                Status = "paid",
                Total = 42.00m,
                RefundedAmount = 0m,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });

        await service.ProcessEventAsync("evt-1", "order.created", payload);

        Assert.Equal(1, await context.Contacts.CountAsync());
        var order = await context.Orders.SingleAsync();
        Assert.Equal(contactId, order.ContactId);
    }

    [Fact]
    public async Task Order_without_contactId_and_without_email_throws()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = JsonSerializer.Serialize(new
        {
            EventId = "evt-1",
            EventType = "order.created",
            Data = new
            {
                OrderId = "order-503",
                Status = "paid",
                Total = 10.00m,
                RefundedAmount = 0m,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-1", "order.created", payload));
        Assert.Equal(0, await context.Orders.CountAsync());
        Assert.Equal(0, await context.Contacts.CountAsync());
    }

    [Fact]
    public async Task Repeated_orders_from_same_email_resolve_to_one_contact()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "order.created",
            OrderPayloadWithEmail("evt-1", "order-600", "repeat@example.com", 30.00m));
        await service.ProcessEventAsync("evt-2", "order.created",
            OrderPayloadWithEmail("evt-2", "order-601", "repeat@example.com", 40.00m));

        Assert.Equal(1, await context.Contacts.CountAsync());
        Assert.Equal(2, await context.Orders.CountAsync());
        var contact = await context.Contacts.SingleAsync();
        var orders = await context.Orders.ToListAsync();
        Assert.All(orders, o => Assert.Equal(contact.Id, o.ContactId));
    }

    public void Dispose() => File.Delete(_databasePath);

    private EcommerceIngestionService CreateService(AppDbContext context)
    {
        var identityService = new ContactIdentityService(
            new ContactIdentityRepository(context),
            new ContactIdentityOptions());
        return new EcommerceIngestionService(
            new EcommerceRepository(context), identityService);
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

    private static async Task<Guid> SeedContactAsync(AppDbContext context, string email)
    {
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Existing",
            Email = email,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();
        return contact.Id;
    }

    private static string OrderPayloadWithEmail(
        string eventId, string orderId, string email, decimal total)
    {
        return JsonSerializer.Serialize(new
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
}
