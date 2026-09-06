using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class ProductMapper
{
    public static IReadOnlyList<ProductListItemDto> ToListItems(IEnumerable<Product> products)
    {
        return products.Select(product => new ProductListItemDto(
            product.Id,
            product.PlatformProductId,
            product.Name,
            product.Price,
            product.InStock,
            product.UpdatedAt
        )).ToList();
    }
}
