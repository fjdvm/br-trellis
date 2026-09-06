namespace ApiOos.Repositories;

using ApiOos.Data;
using ApiOos.Interfaces.Repositories;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;

public class JobApplicationRepository : IJobApplicationRepository
{
    private readonly AppDbContext _context;

    public JobApplicationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<JobApplication> CreateAsync(JobApplication application)
    {
        _context.JobApplications.Add(application);
        await _context.SaveChangesAsync();
        return application;
    }

    public async Task<JobApplication?> GetByIdAsync(Guid id)
    {
        return await _context.JobApplications
            .Include(a => a.JobPosting)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<JobApplication>> GetByJobIdAsync(Guid jobId)
    {
        return await _context.JobApplications
            .Include(a => a.JobPosting)
            .Where(a => a.JobPostingId == jobId)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<JobApplication>> GetAllAsync()
    {
        return await _context.JobApplications
            .Include(a => a.JobPosting)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();
    }
}
