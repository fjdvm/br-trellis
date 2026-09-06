namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface IJobApplicationRepository
{
    Task<JobApplication> CreateAsync(JobApplication application);
    Task<JobApplication?> GetByIdAsync(Guid id);
    Task<IEnumerable<JobApplication>> GetByJobIdAsync(Guid jobId);
    Task<IEnumerable<JobApplication>> GetAllAsync();
}
