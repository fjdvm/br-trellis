using ApiOos.Data;
using ApiOos.DTOs.Requests.Cart;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.DTOs.Webhooks;
using ApiOos.Enums;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// Covers #121 (api-oos side): placing an order emits an <c>order.created</c> event
/// to api-crms's Ecommerce webhook, carrying the customer's email (so api-crms can
/// resolve the Contact) and no pre-known ContactId. The outbound integration is
/// exercised through a fake client — the seam the spec requires.
/// </summary>
public sealed class OrderWebhookDispatchTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly OrderService _orderService;
    private readonly CartService _cartService;
    private readonly FakeEcommerceWebhookClient _webhookClient = new();

    public OrderWebhookDispatchTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        var cartRepository = new CartRepository(_context);
        var orderRepository = new OrderRepository(_context);
        var userRepository = new UserRepository(_context);
        _cartService = new CartService(cartRepository, new ProductRepository(_context));
        _orderService = new OrderService(
            cartRepository, orderRepository, _context, userRepository, _webhookClient);
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateOrderAsync_sends_order_created_event_with_customer_email()
    {
        var user = await CreateUserAsync("buyer@example.com");
        var product = await CreateProductAsync(250.00m);
        await _cartService.AddItemAsync(user.Id,
            new AddCartItemRequest { ProductId = product.Id, Quantity = 2 });

        var orderDto = await _orderService.CreateOrderAsync(user.Id, BuildRequest());

        _webhookClient.Sent.Should().ContainSingle();
        var evt = _webhookClient.Sent.Single();
        evt.EventType.Should().Be("order.created");
        evt.EventId.Should().NotBeNullOrWhiteSpace();
        evt.Data.OrderId.Should().Be(orderDto.OrderNumber);
        evt.Data.CustomerEmail.Should().Be("buyer@example.com");
        evt.Data.Name.Should().Be("Test Buyer", "the shopper's name lets api-crms name the Contact instead of leaving it unnamed");
        evt.Data.ContactId.Should().BeNull("api-crms resolves the Contact from the email");
        evt.Data.Total.Should().Be(orderDto.TotalAmount);
    }

    [Fact]
    public async Task CreateOrderAsync_still_creates_order_when_webhook_delivery_throws()
    {
        _webhookClient.ThrowOnSend = true;
        var user = await CreateUserAsync("resilient@example.com");
        var product = await CreateProductAsync(100.00m);
        await _cartService.AddItemAsync(user.Id,
            new AddCartItemRequest { ProductId = product.Id, Quantity = 1 });

        var orderDto = await _orderService.CreateOrderAsync(user.Id, BuildRequest());

        // Order still persisted despite a failing webhook — CRM is a passive receiver.
        orderDto.Should().NotBeNull();
        (await _context.Orders.CountAsync()).Should().Be(1);
    }

    private async Task<User> CreateUserAsync(string email)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = "Test Buyer",
            PasswordHash = "hashedpassword",
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task<Product> CreateProductAsync(decimal price)
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Ube Cream Spread",
            Price = price,
            Stock = 10,
            SKU = $"UBE-{Guid.NewGuid():N}"[..12],
            IsActive = true,
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return product;
    }

    private static CreateOrderRequest BuildRequest() => new()
    {
        ShippingAddress = new ShippingAddressRequest
        {
            RecipientName = "Bren Raphael",
            Street = "123 Session Rd",
            City = "Baguio City",
            Province = "Benguet",
            PostalCode = "2600",
            Phone = "09171234567",
        },
        PaymentMethod = PaymentMethod.CashOnDelivery,
    };

    private sealed class FakeEcommerceWebhookClient : IEcommerceWebhookClient
    {
        public List<EcommerceWebhookEvent> Sent { get; } = [];
        public bool ThrowOnSend { get; set; }

        public Task SendAsync(EcommerceWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
        {
            if (ThrowOnSend)
            {
                throw new HttpRequestException("simulated CRM outage");
            }

            Sent.Add(webhookEvent);
            return Task.CompletedTask;
        }
    }
}
