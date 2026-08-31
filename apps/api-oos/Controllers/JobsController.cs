namespace ApiOos.Controllers;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/jobs")]
public class JobsController : ControllerBase
{
    private readonly IJobService _jobService;

    public JobsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<JobPostingResponseDto>>> GetActiveJobs()
    {
        var result = await _jobService.GetActiveJobPostingsAsync();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<JobPostingResponseDto>> GetJobById(Guid id)
    {
        var job = await _jobService.GetJobPostingByIdAsync(id);
        if (job == null)
        {
            return NotFound(new { message = $"Job posting with ID {id} was not found or is no longer active." });
        }
        return Ok(job);
    }

    [HttpPost]
    public async Task<ActionResult<JobPostingResponseDto>> CreateJob([FromBody] CreateJobPostingRequestDto request)
    {
        var job = await _jobService.CreateJobPostingAsync(request);
        return CreatedAtAction(nameof(GetJobById), new { id = job.Id }, job);
    }
}
