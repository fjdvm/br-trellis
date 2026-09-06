using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class CartAbandonmentServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"cart-abandonment-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Sweep_flags_inactive_cart_with_items_and_contact_as_abandoned()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = contactId,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        cart.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 1,
            UnitPrice = 10m,
        });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();

        Assert.Single(abandoned);
        Assert.Equal(cart.Id, abandoned[0]);

        var updated = await context.Carts.SingleAsync();
        Assert.Equal(CartStatus.Abandoned, updated.Status);
    }

    [Fact]
    public async Task Sweep_does_not_flag_cart_with_recent_activity()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = contactId,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddMinutes(-30), // within threshold
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-30),
        };
        cart.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 1,
            UnitPrice = 10m,
        });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();

        Assert.Empty(abandoned);
        var updated = await context.Carts.SingleAsync();
        Assert.Equal(CartStatus.Active, updated.Status);
    }

    [Fact]
    public async Task Sweep_does_not_flag_cart_with_no_items()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = contactId,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        // No items added
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();

        Assert.Empty(abandoned);
    }

    [Fact]
    public async Task Sweep_does_not_flag_cart_with_no_contact()
    {
        await using var context = CreateContext();
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = null, // anonymous
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        cart.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 1,
            UnitPrice = 10m,
        });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();

        Assert.Empty(abandoned);
    }

    [Fact]
    public async Task Sweep_does_not_flag_cart_if_order_exists_for_contact()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = contactId,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        cart.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 1,
            UnitPrice = 10m,
        });
        context.Carts.Add(cart);

        // An order exists for this contact created after the cart
        context.Orders.Add(new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = "order-1",
            ContactId = contactId,
            Status = OrderStatus.Paid,
            Total = 10m,
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-1),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-1),
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();

        Assert.Empty(abandoned);
    }

    [Fact]
    public async Task Sweep_does_not_re_flag_already_abandoned_cart()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = contactId,
            Status = CartStatus.Abandoned, // already abandoned
            LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-3),
            UpdatedAt = DateTimeOffset.UtcNow.AddHours(-2),
        };
        cart.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 1,
            UnitPrice = 10m,
        });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();

        Assert.Empty(abandoned);
    }

    [Fact]
    public async Task Sweep_respects_configurable_threshold()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-1",
            ContactId = contactId,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow.AddMinutes(-45), // 45 min ago
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2),
            UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-45),
        };
        cart.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart.Id,
            ProductId = "prod-1",
            ProductName = "Widget",
            Quantity = 1,
            UnitPrice = 10m,
        });
        context.Carts.Add(cart);
        await context.SaveChangesAsync();

        // Default threshold is 1 hour, so 45 min should NOT trigger
        var service = CreateService(context);
        var abandoned = await service.SweepAbandonedCartsAsync();
        Assert.Empty(abandoned);

        // With a 30-min threshold, it SHOULD trigger
        var shortService = CreateService(context, TimeSpan.FromMinutes(30));
        var abandoned2 = await shortService.SweepAbandonedCartsAsync();
        Assert.Single(abandoned2);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CartAbandonmentService CreateService(
        AppDbContext context, TimeSpan? threshold = null)
    {
        var options = new CartAbandonmentOptions
        {
            AbandonmentThreshold = threshold ?? TimeSpan.FromHours(1),
        };
        return new CartAbandonmentService(context, options);
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
}
