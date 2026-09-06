namespace ApiOos.Mappers;

using ApiOos.DTOs.Responses;
using ApiOos.Models;

public static class ProductMapper
{
    public static ProductDto ToDto(Product product)
    {
        return new ProductDto(
            product.Id,
            product.Name,
            product.Description,
            product.Price,
            product.Images ?? new List<string>(),
            product.Stock,
            product.Category,
            product.SKU,
            product.IsActive
        );
    }
}
