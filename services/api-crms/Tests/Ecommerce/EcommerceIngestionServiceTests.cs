using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class EcommerceIngestionServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ecommerce-ingestion-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Order_created_event_creates_order_projection_and_timeline_entry()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 99.99m, 0m);

        var processed = await service.ProcessEventAsync("evt-1", "order.created", payload);

        Assert.True(processed);
        var order = await context.Orders.SingleAsync();
        Assert.Equal("order-100", order.PlatformOrderId);
        Assert.Equal(contactId, order.ContactId);
        Assert.Equal(OrderStatus.Paid, order.Status);
        Assert.Equal(99.99m, order.Total);
        Assert.Equal(0m, order.RefundedAmount);

        var timeline = await context.TimelineEntries.SingleAsync();
        Assert.Equal("ecommerce", timeline.SourceModule);
        Assert.Equal("order.created", timeline.EntryType);
        Assert.Equal(contactId, timeline.ContactId);
    }

    [Fact]
    public async Task Order_created_event_recalculates_ltv()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 150.00m, 0m);

        await service.ProcessEventAsync("evt-1", "order.created", payload);

        var contact = await context.Contacts.SingleAsync();
        Assert.Equal(150.00m, contact.LifetimeValue);
    }

    [Fact]
    public async Task Order_refunded_event_updates_status_and_recalculates_ltv()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        // First: create order
        var createPayload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 200.00m, 0m);
        await service.ProcessEventAsync("evt-1", "order.created", createPayload);

        // Then: refund
        var refundPayload = CreateOrderPayload("evt-2", "order.refunded", "order-100", contactId,
            "refunded", 200.00m, 50.00m);
        await service.ProcessEventAsync("evt-2", "order.refunded", refundPayload);

        var order = await context.Orders.SingleAsync();
        Assert.Equal(OrderStatus.Refunded, order.Status);
        Assert.Equal(50.00m, order.RefundedAmount);

        // LTV: order is Refunded so it doesn't count (only Paid/Shipped/Delivered count)
        var contact = await context.Contacts.SingleAsync();
        Assert.Equal(0m, contact.LifetimeValue);
    }

    [Fact]
    public async Task Duplicate_event_id_is_skipped()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 100.00m, 0m);

        var first = await service.ProcessEventAsync("evt-1", "order.created", payload);
        var second = await service.ProcessEventAsync("evt-1", "order.created", payload);

        Assert.True(first);
        Assert.False(second);
        Assert.Equal(1, await context.Orders.CountAsync());
        Assert.Equal(1, await context.TimelineEntries.CountAsync());
    }

    [Fact]
    public async Task Order_updated_arriving_before_created_produces_correct_projection()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        // Update arrives first (out-of-order)
        var updatePayload = CreateOrderPayload("evt-2", "order.updated", "order-100", contactId,
            "shipped", 100.00m, 0m);
        await service.ProcessEventAsync("evt-2", "order.updated", updatePayload);

        var order = await context.Orders.SingleAsync();
        Assert.Equal("order-100", order.PlatformOrderId);
        Assert.Equal(OrderStatus.Shipped, order.Status);

        // Then created arrives
        var createPayload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 100.00m, 0m);
        await service.ProcessEventAsync("evt-1", "order.created", createPayload);

        // Should still be one order, upserted to latest event's data
        Assert.Equal(1, await context.Orders.CountAsync());
        var updated = await context.Orders.SingleAsync();
        Assert.Equal(OrderStatus.Paid, updated.Status); // Last-write-wins on upsert
    }

    [Fact]
    public async Task Cart_updated_creates_cart_projection_on_first_occurrence()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateCartPayload("evt-1", "cart-200", contactId);

        await service.ProcessEventAsync("evt-1", "cart.updated", payload);

        var cart = await context.Carts.Include(c => c.Items).SingleAsync();
        Assert.Equal("cart-200", cart.PlatformCartId);
        Assert.Equal(contactId, cart.ContactId);
        Assert.Equal(CartStatus.Active, cart.Status);
        Assert.Equal(2, cart.Items.Count);
    }

    [Fact]
    public async Task Cart_updated_upserts_existing_cart()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload1 = CreateCartPayload("evt-1", "cart-200", contactId);
        await service.ProcessEventAsync("evt-1", "cart.updated", payload1);

        // Second update with different items
        var payload2 = CreateCartPayloadOneItem("evt-2", "cart-200", contactId);
        await service.ProcessEventAsync("evt-2", "cart.updated", payload2);

        Assert.Equal(1, await context.Carts.CountAsync());
        var cart = await context.Carts.Include(c => c.Items).SingleAsync();
        Assert.Single(cart.Items);
    }

    [Fact]
    public async Task Product_updated_creates_product_projection()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = CreateProductPayload("evt-1", "prod-300", "Widget", 29.99m, true);

        await service.ProcessEventAsync("evt-1", "product.updated", payload);

        var product = await context.Products.SingleAsync();
        Assert.Equal("prod-300", product.PlatformProductId);
        Assert.Equal("Widget", product.Name);
        Assert.Equal(29.99m, product.Price);
        Assert.True(product.InStock);
    }

    [Fact]
    public async Task Product_updated_upserts_existing_product()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload1 = CreateProductPayload("evt-1", "prod-300", "Widget", 29.99m, true);
        await service.ProcessEventAsync("evt-1", "product.updated", payload1);

        var payload2 = CreateProductPayload("evt-2", "prod-300", "Widget v2", 39.99m, false);
        await service.ProcessEventAsync("evt-2", "product.updated", payload2);

        Assert.Equal(1, await context.Products.CountAsync());
        var product = await context.Products.SingleAsync();
        Assert.Equal("Widget v2", product.Name);
        Assert.Equal(39.99m, product.Price);
        Assert.False(product.InStock);
    }

    [Fact]
    public async Task Order_with_line_items_persists_items()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 99.99m, 0m);

        await service.ProcessEventAsync("evt-1", "order.created", payload);

        var order = await context.Orders.Include(o => o.LineItems).SingleAsync();
        Assert.Equal(2, order.LineItems.Count);
        Assert.Contains(order.LineItems, i => i.ProductName == "Item A");
        Assert.Contains(order.LineItems, i => i.ProductName == "Item B");
    }

    [Fact]
    public async Task Multiple_orders_accumulate_ltv()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload1 = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 100.00m, 0m);
        await service.ProcessEventAsync("evt-1", "order.created", payload1);

        var payload2 = CreateOrderPayload("evt-2", "order.created", "order-101", contactId,
            "delivered", 200.00m, 0m);
        await service.ProcessEventAsync("evt-2", "order.created", payload2);

        var contact = await context.Contacts.SingleAsync();
        Assert.Equal(300.00m, contact.LifetimeValue);
    }

    [Fact]
    public async Task Fully_refunded_order_contributes_zero_to_ltv()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        // Create a paid order
        var createPayload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 100.00m, 0m);
        await service.ProcessEventAsync("evt-1", "order.created", createPayload);

        // Full refund (changes status to Refunded)
        var refundPayload = CreateOrderPayload("evt-2", "order.refunded", "order-100", contactId,
            "refunded", 100.00m, 100.00m);
        await service.ProcessEventAsync("evt-2", "order.refunded", refundPayload);

        var contact = await context.Contacts.SingleAsync();
        // Refunded orders don't count (only Paid/Shipped/Delivered)
        Assert.Equal(0m, contact.LifetimeValue);
    }

    [Fact]
    public async Task Unknown_event_type_throws_and_leaves_zero_rows()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = JsonSerializer.Serialize(new
        {
            EventId = "evt-bad",
            EventType = "unknown.type",
            Data = new
            {
                ContactId = contactId.ToString(),
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-bad", "unknown.type", payload));

        // Nothing was persisted — transaction was rolled back
        Assert.Equal(0, await context.Orders.CountAsync());
        Assert.Equal(0, await context.ProcessedEvents.CountAsync());
        Assert.Equal(0, await context.TimelineEntries.CountAsync());
        Assert.Null(await context.EcommerceSyncStatuses.FindAsync(1));
    }

    [Fact]
    public async Task First_event_sets_both_first_and_last_event_received_at()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 50.00m, 0m);

        await service.ProcessEventAsync("evt-1", "order.created", payload);

        var status = await context.EcommerceSyncStatuses.FindAsync(1);
        Assert.NotNull(status);
        Assert.NotNull(status.FirstEventReceivedAt);
        Assert.NotNull(status.LastEventReceivedAt);
        Assert.Equal(status.FirstEventReceivedAt, status.LastEventReceivedAt);
    }

    [Fact]
    public async Task Second_event_of_different_type_updates_last_but_not_first()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        // First event: order
        var orderPayload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 50.00m, 0m);
        await service.ProcessEventAsync("evt-1", "order.created", orderPayload);

        var statusAfterFirst = await context.EcommerceSyncStatuses.FindAsync(1);
        var firstReceivedAt = statusAfterFirst!.FirstEventReceivedAt;
        var lastAfterFirst = statusAfterFirst.LastEventReceivedAt;

        // Small delay to ensure timestamps differ
        await Task.Delay(50);

        // Second event: cart (different type)
        var cartPayload = CreateCartPayload("evt-2", "cart-200", contactId);
        await service.ProcessEventAsync("evt-2", "cart.updated", cartPayload);

        // Re-read (detach to force fresh read)
        context.ChangeTracker.Clear();
        var statusAfterSecond = await context.EcommerceSyncStatuses.FindAsync(1);
        Assert.NotNull(statusAfterSecond);
        Assert.Equal(firstReceivedAt, statusAfterSecond.FirstEventReceivedAt);
        Assert.True(statusAfterSecond.LastEventReceivedAt >= lastAfterFirst);
    }

    [Fact]
    public async Task Failed_event_does_not_update_sync_status()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        // First, successfully process an event so sync status exists
        var goodPayload = CreateOrderPayload("evt-1", "order.created", "order-100", contactId,
            "paid", 50.00m, 0m);
        await service.ProcessEventAsync("evt-1", "order.created", goodPayload);

        var statusBefore = await context.EcommerceSyncStatuses.FindAsync(1);
        var lastBefore = statusBefore!.LastEventReceivedAt;

        // Now try a bad event
        var badPayload = JsonSerializer.Serialize(new
        {
            EventId = "evt-bad",
            EventType = "unknown.type",
            Data = new
            {
                ContactId = contactId.ToString(),
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-bad", "unknown.type", badPayload));

        // Sync status should be unchanged
        context.ChangeTracker.Clear();
        var statusAfter = await context.EcommerceSyncStatuses.FindAsync(1);
        Assert.Equal(lastBefore, statusAfter!.LastEventReceivedAt);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

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

    private static async Task<Guid> SeedContactAsync(AppDbContext context)
    {
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Test Customer",
            Email = "test@example.com",
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();
        return contact.Id;
    }

    private static string CreateOrderPayload(
        string eventId, string eventType, string orderId, Guid contactId,
        string status, decimal total, decimal refundedAmount)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = eventType,
            Data = new
            {
                OrderId = orderId,
                ContactId = contactId.ToString(),
                Status = status,
                Total = total,
                RefundedAmount = refundedAmount,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
                LineItems = new[]
                {
                    new { ProductId = "prod-1", ProductName = "Item A", Quantity = 1, UnitPrice = 49.99m },
                    new { ProductId = "prod-2", ProductName = "Item B", Quantity = 1, UnitPrice = 50.00m },
                },
            },
        });
    }

    private static string CreateCartPayload(string eventId, string cartId, Guid contactId)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "cart.updated",
            Data = new
            {
                CartId = cartId,
                ContactId = contactId.ToString(),
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
                Items = new[]
                {
                    new { ProductId = "prod-1", ProductName = "Item A", Quantity = 1, UnitPrice = 29.99m },
                    new { ProductId = "prod-2", ProductName = "Item B", Quantity = 2, UnitPrice = 19.99m },
                },
            },
        });
    }

    private static string CreateCartPayloadOneItem(string eventId, string cartId, Guid contactId)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "cart.updated",
            Data = new
            {
                CartId = cartId,
                ContactId = contactId.ToString(),
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
                Items = new[]
                {
                    new { ProductId = "prod-1", ProductName = "Item A", Quantity = 3, UnitPrice = 29.99m },
                },
            },
        });
    }

    private static string CreateProductPayload(
        string eventId, string productId, string name, decimal price, bool inStock)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "product.updated",
            Data = new
            {
                ProductId = productId,
                Name = name,
                Price = price,
                InStock = inStock,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }
}
