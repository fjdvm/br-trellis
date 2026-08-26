using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class OrderServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"order-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ListOrdersAsync_returns_orders_ordered_by_created_at_descending_with_contact_and_line_item_data()
    {
        await using var context = CreateContext();

        var contact1 = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Alice",
            Email = "alice@example.com",
        };
        var contact2 = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Bob",
            Email = "bob@example.com",
        };
        context.Contacts.AddRange(contact1, contact2);

        var olderOrder = new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = "order-1",
            ContactId = contact1.Id,
            Status = OrderStatus.Paid,
            Total = 100m,
            RefundedAmount = 0m,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddDays(-1),
        };
        olderOrder.LineItems.Add(new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = olderOrder.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 2,
            UnitPrice = 50m,
        });

        var newerOrder = new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = "order-2",
            ContactId = contact2.Id,
            Status = OrderStatus.Shipped,
            Total = 75m,
            RefundedAmount = 0m,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        newerOrder.LineItems.Add(new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = newerOrder.Id,
            ProductId = "prod-2",
            ProductName = "Gadget",
            Quantity = 1,
            UnitPrice = 30m,
        });
        newerOrder.LineItems.Add(new OrderLineItem
        {
            Id = Guid.NewGuid(),
            OrderId = newerOrder.Id,
            ProductId = "prod-3",
            ProductName = "Gizmo",
            Quantity = 1,
            UnitPrice = 45m,
        });

        context.Orders.AddRange(olderOrder, newerOrder);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var orders = await service.ListOrdersAsync(CancellationToken.None);

        Assert.Equal(2, orders.Count);

        Assert.Equal(newerOrder.Id, orders[0].Id);
        Assert.Equal(contact2.Id, orders[0].ContactId);
        Assert.Equal("Bob", orders[0].ContactName);
        Assert.Equal("bob@example.com", orders[0].ContactEmail);
        Assert.Equal(2, orders[0].LineItemCount);

        Assert.Equal(olderOrder.Id, orders[1].Id);
        Assert.Equal(contact1.Id, orders[1].ContactId);
        Assert.Equal("Alice", orders[1].ContactName);
        Assert.Equal("alice@example.com", orders[1].ContactEmail);
        Assert.Equal(1, orders[1].LineItemCount);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private OrderService CreateService(AppDbContext context)
    {
        return new OrderService(new OrderRepository(context));
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
}
