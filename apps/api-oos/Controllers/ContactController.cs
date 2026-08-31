namespace ApiOos.Controllers;

using ApiOos.DTOs.Requests;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

[ApiController]
[Route("api/contact")]
[EnableRateLimiting("StrictRateLimit")]
public class ContactController : ControllerBase
{
    private readonly IContactService _contactService;

    public ContactController(IContactService contactService)
    {
        _contactService = contactService;
    }

    [HttpPost]
    public async Task<ActionResult<ContactInquiryResponseDto>> SubmitInquiry([FromBody] CreateContactInquiryRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Subject) ||
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "All fields (name, email, subject, message) are required." });
        }

        var result = await _contactService.CreateInquiryAsync(request);
        return Ok(result);
    }
}
