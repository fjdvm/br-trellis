using api_crms.Data;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class ProductServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"product-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ListProductsAsync_returns_products_ordered_by_name_with_mapped_fields()
    {
        await using var context = CreateContext();
        var productB = new Product
        {
            Id = Guid.NewGuid(),
            PlatformProductId = "prod-b",
            Name = "Bravo Widget",
            Price = 30m,
            InStock = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        var productA = new Product
        {
            Id = Guid.NewGuid(),
            PlatformProductId = "prod-a",
            Name = "Alpha Widget",
            Price = 25m,
            InStock = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        context.Products.AddRange(productB, productA);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var products = await service.ListProductsAsync(CancellationToken.None);

        Assert.Equal(2, products.Count);

        Assert.Equal(productA.Id, products[0].Id);
        Assert.Equal(productA.PlatformProductId, products[0].PlatformProductId);
        Assert.Equal(productA.Name, products[0].Name);
        Assert.Equal(productA.Price, products[0].Price);
        Assert.True(products[0].InStock);
        Assert.Equal(productA.UpdatedAt, products[0].UpdatedAt);

        Assert.Equal(productB.Id, products[1].Id);
        Assert.Equal(productB.PlatformProductId, products[1].PlatformProductId);
        Assert.Equal(productB.Name, products[1].Name);
        Assert.Equal(productB.Price, products[1].Price);
        Assert.False(products[1].InStock);
        Assert.Equal(productB.UpdatedAt, products[1].UpdatedAt);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private ProductService CreateService(AppDbContext context)
    {
        return new ProductService(new ProductRepository(context));
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
