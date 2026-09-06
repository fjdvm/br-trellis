using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Services;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/contact-identity")]
public sealed class ContactIdentityController(
    IContactIdentityService contactIdentityService) : ControllerBase
{
    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok();
    }

    [HttpPost("resolve-or-create")]
    public async Task<ActionResult<ResolveOrCreateContactResult>> ResolveOrCreateContact(
        ResolveOrCreateContactCommand command,
        CancellationToken cancellationToken)
    {
        var result = await contactIdentityService.ResolveOrCreateContactAsync(
            command,
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("pending-review")]
    public async Task<ActionResult<IReadOnlyList<PendingReviewContact>>> ListPendingReviewContacts(
        CancellationToken cancellationToken)
    {
        return Ok(await contactIdentityService.ListPendingReviewContactsAsync(cancellationToken));
    }
}
