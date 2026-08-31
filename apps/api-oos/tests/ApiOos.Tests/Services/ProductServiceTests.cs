namespace ApiOos.Tests.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Enums;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using ApiOos.Services;

using FluentAssertions;
using Xunit;

public class ProductServiceTests
{
    private class FakeProductRepository : IProductRepository
    {
        public Product? ReturnProduct { get; set; }
        public PagedResult<Product>? ReturnPagedResult { get; set; }

        public Task<PagedResult<Product>> GetAllAsync(ProductQueryParams queryParams)
        {
            return Task.FromResult(ReturnPagedResult ?? new PagedResult<Product>(new List<Product>(), 1, 12, 0, 0));
        }

        public Task<Product?> GetByIdAsync(Guid id)
        {
            return Task.FromResult(ReturnProduct?.Id == id ? ReturnProduct : null);
        }
    }

    [Fact]
    public async Task GetProductsAsync_ReturnsMappedPagedResult()
    {
        var sampleProduct = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Classic Ube Halaya",
            Description = "Test Desc",
            Price = 350.00m,
            Stock = 10,
            Category = ProductCategory.Jams,
            SKU = "UBE-001",
            IsActive = true
        };

        var fakeRepo = new FakeProductRepository
        {
            ReturnPagedResult = new PagedResult<Product>(new List<Product> { sampleProduct }, 1, 12, 1, 1)
        };
        var service = new ProductService(fakeRepo);

        var result = await service.GetProductsAsync(new ProductQueryParams());

        result.Should().NotBeNull();
        result.Data.Should().HaveCount(1);
        result.Data[0].Name.Should().Be("Classic Ube Halaya");
        result.Data[0].Category.Should().Be(ProductCategory.Jams);
    }

    [Fact]
    public async Task GetProductByIdAsync_WhenExists_ReturnsDto()
    {
        var productId = Guid.NewGuid();
        var sampleProduct = new Product
        {
            Id = productId,
            Name = "Ube Crinkle Cookies",
            Price = 220m,
            Category = ProductCategory.Pastries,
            SKU = "UBE-002"
        };

        var fakeRepo = new FakeProductRepository { ReturnProduct = sampleProduct };
        var service = new ProductService(fakeRepo);

        var result = await service.GetProductByIdAsync(productId);

        result.Should().NotBeNull();
        result!.Id.Should().Be(productId);
        result.Name.Should().Be("Ube Crinkle Cookies");
    }

    [Fact]
    public async Task GetProductByIdAsync_WhenNotFound_ReturnsNull()
    {
        var fakeRepo = new FakeProductRepository();
        var service = new ProductService(fakeRepo);

        var result = await service.GetProductByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }
}
