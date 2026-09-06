namespace ApiOos.Tests.Controllers;

using ApiOos.Controllers;
using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Enums;
using ApiOos.Interfaces.Services;
using ApiOos.Models;

using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Xunit;

public class ProductsControllerTests
{
    private class FakeProductService : IProductService
    {
        public ProductDto? ReturnDto { get; set; }
        public PagedResult<ProductDto>? ReturnPagedResult { get; set; }

        public Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParams queryParams)
        {
            return Task.FromResult(ReturnPagedResult ?? new PagedResult<ProductDto>(new List<ProductDto>(), 1, 12, 0, 0));
        }

        public Task<ProductDto?> GetProductByIdAsync(Guid id)
        {
            return Task.FromResult(ReturnDto?.Id == id ? ReturnDto : null);
        }
    }

    [Fact]
    public async Task GetProducts_ReturnsOkWithPagedResult()
    {
        var dto = new ProductDto(
            Guid.NewGuid(), "Ube Jam", "Desc", 350m, new List<string>(), 5, ProductCategory.Jams, "UBE-1", true
        );
        var paged = new PagedResult<ProductDto>(new List<ProductDto> { dto }, 1, 12, 1, 1);

        var fakeService = new FakeProductService { ReturnPagedResult = paged };
        var controller = new ProductsController(fakeService);

        var actionResult = await controller.GetProducts(new ProductQueryParams());

        var okResult = actionResult.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
        var value = okResult.Value.Should().BeOfType<PagedResult<ProductDto>>().Subject;
        value.Data.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetProductById_WhenFound_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var dto = new ProductDto(
            id, "Ube Cookie", "Desc", 220m, new List<string>(), 10, ProductCategory.Pastries, "UBE-2", true
        );

        var fakeService = new FakeProductService { ReturnDto = dto };
        var controller = new ProductsController(fakeService);

        var actionResult = await controller.GetProductById(id);

        var okResult = actionResult.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GetProductById_WhenNotFound_Returns404()
    {
        var fakeService = new FakeProductService();
        var controller = new ProductsController(fakeService);

        var actionResult = await controller.GetProductById(Guid.NewGuid());

        var notFoundResult = actionResult.Result.Should().BeOfType<NotFoundObjectResult>().Subject;
        notFoundResult.StatusCode.Should().Be(404);
    }
}
