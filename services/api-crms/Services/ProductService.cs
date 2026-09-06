using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class ProductService(IProductRepository productRepository) : IProductService
{
    public async Task<IReadOnlyList<ProductListItemDto>> ListProductsAsync(CancellationToken cancellationToken)
    {
        var products = await productRepository.ListProductsAsync(cancellationToken);
        return ProductMapper.ToListItems(products);
    }
}
