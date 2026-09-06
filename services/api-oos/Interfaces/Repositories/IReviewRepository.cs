namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface IReviewRepository
{
    Task<IEnumerable<ProductReview>> GetByProductIdAsync(Guid productId);
    Task<bool> HasUserReviewedProductAsync(Guid userId, Guid productId);
    Task<ProductReview> CreateAsync(ProductReview review);
}
