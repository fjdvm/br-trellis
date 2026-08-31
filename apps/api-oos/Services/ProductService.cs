namespace ApiOos.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Mappers;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;

    public ProductService(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParams queryParams)
    {
        var result = await _productRepository.GetAllAsync(queryParams);
        var dtos = result.Data.Select(ProductMapper.ToDto).ToList();
        return new PagedResult<ProductDto>(dtos, result.Page, result.PageSize, result.TotalCount, result.TotalPages);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid id)
    {
        var product = await _productRepository.GetByIdAsync(id);
        return product != null ? ProductMapper.ToDto(product) : null;
    }
}
