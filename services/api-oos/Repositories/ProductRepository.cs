namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class ProductRepository : IProductRepository
{
    private readonly AppDbContext _context;

    public ProductRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<Product>> GetAllAsync(ProductQueryParams queryParams)
    {
        var query = _context.Products.AsNoTracking().Where(p => p.IsActive);

        if (queryParams.Category.HasValue)
        {
            query = query.Where(p => p.Category == queryParams.Category.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var search = queryParams.Search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search) || p.Description.ToLower().Contains(search));
        }

        query = queryParams.Sort switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "name_desc" => query.OrderByDescending(p => p.Name),
            "name_asc" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var page = queryParams.Page < 1 ? 1 : queryParams.Page;
        var pageSize = queryParams.PageSize < 1 ? 12 : (queryParams.PageSize > 100 ? 100 : queryParams.PageSize);
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Product>(data, page, pageSize, totalCount, totalPages);
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
    }
}
