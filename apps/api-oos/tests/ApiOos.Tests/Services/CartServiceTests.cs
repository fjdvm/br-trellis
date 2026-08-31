namespace ApiOos.Tests.Services;

using ApiOos.Data;
using ApiOos.DTOs.Requests.Cart;
using ApiOos.Models;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class CartServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly CartRepository _cartRepository;
    private readonly ProductRepository _productRepository;
    private readonly CartService _cartService;

    public CartServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;

        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        _cartRepository = new CartRepository(_context);
        _productRepository = new ProductRepository(_context);
        _cartService = new CartService(_cartRepository, _productRepository);
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
            FullName = "Test User",
            PasswordHash = "hashedpassword"
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task GetCartAsync_WhenCartDoesNotExist_CreatesAndReturnsEmptyCart()
    {
        var user = await CreateTestUserAsync();

        var cart = await _cartService.GetCartAsync(user.Id);

        cart.Should().NotBeNull();
        cart.UserId.Should().Be(user.Id);
        cart.Items.Should().BeEmpty();
        cart.Subtotal.Should().Be(0);
    }

    [Fact]
    public async Task AddItemAsync_WhenProductValid_AddsToCart()
    {
        var user = await CreateTestUserAsync();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Ube Halaya Special",
            Price = 350.00m,
            Stock = 10,
            SKU = "UBE-SPECIAL",
            IsActive = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var request = new AddCartItemRequest { ProductId = product.Id, Quantity = 2 };

        var result = await _cartService.AddItemAsync(user.Id, request);

        result.Should().NotBeNull();
        result.Items.Should().HaveCount(1);
        result.Items[0].ProductName.Should().Be("Ube Halaya Special");
        result.Items[0].Quantity.Should().Be(2);
        result.Subtotal.Should().Be(700.00m);
    }

    [Fact]
    public async Task AddItemAsync_WhenQuantityExceedsStock_ThrowsInvalidOperationException()
    {
        var user = await CreateTestUserAsync();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Ube Jam Limited",
            Price = 400.00m,
            Stock = 3,
            SKU = "UBE-LIM",
            IsActive = true
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        var request = new AddCartItemRequest { ProductId = product.Id, Quantity = 5 };

        var act = async () => await _cartService.AddItemAsync(user.Id, request);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Insufficient stock*");
    }
}
