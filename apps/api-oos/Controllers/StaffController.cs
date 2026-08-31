namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.Constants;
using ApiOos.DTOs.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

/// <summary>
/// Staff-scoped endpoints, authenticated with the internal-auth-service scheme
/// (the same one <c>web-crms</c>/<c>api-crms</c> use). Serves <c>web-oos</c>.
/// </summary>
[Authorize(AuthenticationSchemes = AuthSchemes.Staff)]
[ApiController]
[Route("api/staff")]
public class StaffController : ControllerBase
{
    /// <summary>
    /// Returns the identity of the currently-authenticated staff member. Used by
    /// web-oos to confirm the internal-auth token is accepted by api-oos.
    /// </summary>
    [HttpGet("me")]
    public ActionResult<StaffIdentityResponse> GetMe()
    {
        var subject = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        var email = User.FindFirst(ClaimTypes.Email)?.Value
            ?? User.FindFirst("email")?.Value;
        var name = User.FindFirst(ClaimTypes.Name)?.Value
            ?? User.FindFirst("name")?.Value;

        return Ok(new StaffIdentityResponse
        {
            Subject = subject,
            Email = email,
            Name = name,
        });
    }
}
