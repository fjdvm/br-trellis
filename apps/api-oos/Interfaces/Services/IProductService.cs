namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(ProductQueryParams queryParams);
    Task<ProductDto?> GetProductByIdAsync(Guid id);
}
