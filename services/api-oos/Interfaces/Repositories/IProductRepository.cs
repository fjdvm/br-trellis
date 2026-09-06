namespace ApiOos.Interfaces.Repositories;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Models;

public interface IProductRepository
{
    Task<PagedResult<Product>> GetAllAsync(ProductQueryParams queryParams);
    Task<Product?> GetByIdAsync(Guid id);
}
