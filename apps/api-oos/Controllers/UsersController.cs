namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.DTOs.Requests.Users;
using ApiOos.DTOs.Responses.Auth;
using ApiOos.DTOs.Responses.Users;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = GetCurrentUserId();
        var user = await _userService.GetMeAsync(userId);
        return Ok(user);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var userId = GetCurrentUserId();
        var updated = await _userService.UpdateMeAsync(userId, request);
        return Ok(updated);
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        await _userService.ChangePasswordAsync(userId, request);
        return Ok(new { message = "Password updated successfully." });
    }

    [HttpGet("me/addresses")]
    public async Task<ActionResult<IEnumerable<AddressDto>>> GetAddresses()
    {
        var userId = GetCurrentUserId();
        var addresses = await _userService.GetAddressesAsync(userId);
        return Ok(addresses);
    }

    [HttpPost("me/addresses")]
    public async Task<ActionResult<AddressDto>> AddAddress([FromBody] AddressRequest request)
    {
        var userId = GetCurrentUserId();
        var created = await _userService.AddAddressAsync(userId, request);
        return CreatedAtAction(nameof(GetAddresses), new { id = created.Id }, created);
    }

    [HttpPut("me/addresses/{id:guid}")]
    public async Task<ActionResult<AddressDto>> UpdateAddress(Guid id, [FromBody] AddressRequest request)
    {
        var userId = GetCurrentUserId();
        var updated = await _userService.UpdateAddressAsync(userId, id, request);
        return Ok(updated);
    }

    [HttpDelete("me/addresses/{id:guid}")]
    public async Task<IActionResult> DeleteAddress(Guid id)
    {
        var userId = GetCurrentUserId();
        await _userService.DeleteAddressAsync(userId, id);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (subClaim == null || !Guid.TryParse(subClaim.Value, out var userId))
        {
            throw new UnauthorizedException("User ID claim is missing or invalid.");
        }
        return userId;
    }
}
