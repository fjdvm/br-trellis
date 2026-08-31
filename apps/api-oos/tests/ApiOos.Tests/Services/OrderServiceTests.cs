namespace ApiOos.Tests.Services;

using ApiOos.Data;
using ApiOos.DTOs.Requests.Cart;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.Enums;
using ApiOos.Models;
using ApiOos.Repositories;

using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class OrderServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly CartRepository _cartRepository;
    private readonly OrderRepository _orderRepository;
    private readonly CartService _cartService;
    private readonly OrderService _orderService;

    public OrderServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        _cartRepository = new CartRepository(_context);
        _orderRepository = new OrderRepository(_context);
        _cartService = new CartService(_cartRepository, new ProductRepository(_context));
        _orderService = new OrderService(
            _cartRepository,
            _orderRepository,
            _context,
            new UserRepository(_context),
            new NoOpEcommerceWebhookClient());
    }

    private sealed class NoOpEcommerceWebhookClient : ApiOos.Interfaces.Services.IEcommerceWebhookClient
    {
        public Task SendAsync(
            ApiOos.DTOs.Webhooks.EcommerceWebhookEvent webhookEvent,
            CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    private async Task<User> CreateTestUserAsync()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"test-{Guid.NewGuid()}@example.com",
            FullName = "Test Buyer",
            PasswordHash = "hashedpassword"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task CreateOrderAsync_WhenCartHasItems_CreatesOrderAndDecrementsStock()
    {
        var user = await CreateTestUserAsync();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Ube Cream Spread",
            Price = 250.00m,
            Stock = 10,
            SKU = "UBE-CREAM",
            IsActive = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        await _cartService.AddItemAsync(user.Id, new AddCartItemRequest { ProductId = product.Id, Quantity = 2 });

        var request = new CreateOrderRequest
        {
            ShippingAddress = new ShippingAddressRequest
            {
                RecipientName = "Bren Raphael",
                Street = "123 Session Rd",
                City = "Baguio City",
                Province = "Benguet",
                PostalCode = "2600",
                Phone = "09171234567"
            },
            PaymentMethod = PaymentMethod.CashOnDelivery
        };

        var orderDto = await _orderService.CreateOrderAsync(user.Id, request);

        orderDto.Should().NotBeNull();
        orderDto.OrderNumber.Should().StartWith("ORD-");
        orderDto.Subtotal.Should().Be(500.00m);
        orderDto.ShippingFee.Should().Be(100.00m);
        orderDto.TotalAmount.Should().Be(600.00m);
        orderDto.Items.Should().HaveCount(1);
        orderDto.PaymentMethod.Should().Be("CashOnDelivery");

        // Verify stock was decremented from 10 to 8
        var updatedProduct = await _context.Products.FindAsync(product.Id);
        updatedProduct!.Stock.Should().Be(8);

        // Verify cart is now empty
        var cart = await _cartService.GetCartAsync(user.Id);
        cart.Items.Should().BeEmpty();
    }

}