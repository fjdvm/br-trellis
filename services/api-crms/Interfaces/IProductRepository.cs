using api_crms.Models;

namespace api_crms.Interfaces;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> ListProductsAsync(CancellationToken cancellationToken);
}
