namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class ReviewRepository : IReviewRepository
{
    private readonly AppDbContext _context;

    public ReviewRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProductReview>> GetByProductIdAsync(Guid productId)
    {
        return await _context.ProductReviews
            .Include(r => r.User)
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> HasUserReviewedProductAsync(Guid userId, Guid productId)
    {
        return await _context.ProductReviews
            .AnyAsync(r => r.UserId == userId && r.ProductId == productId);
    }

    public async Task<ProductReview> CreateAsync(ProductReview review)
    {
        await _context.ProductReviews.AddAsync(review);
        await _context.SaveChangesAsync();
        return review;
    }
}
