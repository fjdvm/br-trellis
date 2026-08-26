using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IProductService
{
    Task<IReadOnlyList<ProductListItemDto>> ListProductsAsync(CancellationToken cancellationToken);
}
