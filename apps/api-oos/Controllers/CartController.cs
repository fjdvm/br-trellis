namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.DTOs.Requests.Cart;
using ApiOos.DTOs.Responses.Cart;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/cart")]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var userId = GetCurrentUserId();
        var cart = await _cartService.GetCartAsync(userId);
        return Ok(cart);
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem([FromBody] AddCartItemRequest request)
    {
        var userId = GetCurrentUserId();
        var cart = await _cartService.AddItemAsync(userId, request);
        return Ok(cart);
    }

    [HttpPut("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> UpdateItem(Guid id, [FromBody] UpdateCartItemRequest request)
    {
        var userId = GetCurrentUserId();
        var cart = await _cartService.UpdateItemAsync(userId, id, request);
        return Ok(cart);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<ActionResult<CartDto>> RemoveItem(Guid id)
    {
        var userId = GetCurrentUserId();
        var cart = await _cartService.RemoveItemAsync(userId, id);
        return Ok(cart);
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetCurrentUserId();
        await _cartService.ClearCartAsync(userId);
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
