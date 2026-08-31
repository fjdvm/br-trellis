namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface IJobPostingRepository
{
    Task<IEnumerable<JobPosting>> GetAllActiveAsync();
    Task<JobPosting?> GetByIdAsync(Guid id);
    Task<JobPosting> CreateAsync(JobPosting posting);
    Task<JobPosting> UpdateAsync(JobPosting posting);
    Task DeleteAsync(Guid id);
}
