using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/carts")]
[Authorize(Policy = CrmPermissionPolicies.EcommerceCanRead)]
public sealed class CartController(ICartService cartService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CartListItemDto>>> ListCarts(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        CartStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<CartStatus>(status, ignoreCase: true, out var result))
            {
                return BadRequest($"Invalid status value: {status}");
            }
            parsedStatus = result;
        }

        return Ok(await cartService.ListCartsAsync(parsedStatus, cancellationToken));
    }
}
