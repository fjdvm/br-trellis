namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class JobPostingRepository : IJobPostingRepository
{
    private readonly AppDbContext _context;

    public JobPostingRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<JobPosting>> GetAllActiveAsync()
    {
        return await _context.JobPostings
            .Where(j => j.IsActive)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();
    }

    public async Task<JobPosting?> GetByIdAsync(Guid id)
    {
        return await _context.JobPostings.FindAsync(id);
    }

    public async Task<JobPosting> CreateAsync(JobPosting posting)
    {
        _context.JobPostings.Add(posting);
        await _context.SaveChangesAsync();
        return posting;
    }

    public async Task<JobPosting> UpdateAsync(JobPosting posting)
    {
        posting.UpdatedAt = DateTime.UtcNow;
        _context.JobPostings.Update(posting);
        await _context.SaveChangesAsync();
        return posting;
    }

    public async Task DeleteAsync(Guid id)
    {
        var posting = await _context.JobPostings.FindAsync(id);
        if (posting != null)
        {
            _context.JobPostings.Remove(posting);
            await _context.SaveChangesAsync();
        }
    }
}
