namespace ApiOos.Controllers;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

[ApiController]
[Route("api/applications")]
[EnableRateLimiting("StrictRateLimit")]
public class ApplicationsController : ControllerBase
{
    private readonly IJobService _jobService;

    public ApplicationsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<JobApplicationResponseDto>> SubmitApplication([FromForm] SubmitApplicationRequestDto request)
    {
        var result = await _jobService.SubmitApplicationAsync(request);
        return Ok(result);
    }
}
