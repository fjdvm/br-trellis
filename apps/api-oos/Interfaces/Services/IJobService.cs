namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;

public interface IJobService
{
    Task<IEnumerable<JobPostingResponseDto>> GetActiveJobPostingsAsync();
    Task<JobPostingResponseDto?> GetJobPostingByIdAsync(Guid id);
    Task<JobApplicationResponseDto> SubmitApplicationAsync(SubmitApplicationRequestDto request);
    Task<JobPostingResponseDto> CreateJobPostingAsync(CreateJobPostingRequestDto request);
}
