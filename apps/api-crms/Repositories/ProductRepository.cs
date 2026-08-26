using api_crms.Data;
using api_crms.Interfaces;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Repositories;

public sealed class ProductRepository(AppDbContext dbContext) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> ListProductsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Products.AsNoTracking()
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }
}
