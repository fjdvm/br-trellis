namespace ApiOos.Controllers;

using System.Security.Claims;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.DTOs.Responses.Orders;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet("checkout-summary")]
    public async Task<ActionResult<CheckoutSummaryDto>> GetCheckoutSummary()
    {
        var userId = GetCurrentUserId();
        var summary = await _orderService.CalculateCheckoutSummaryAsync(userId);
        return Ok(summary);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var userId = GetCurrentUserId();
        var order = await _orderService.CreateOrderAsync(userId, request);
        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetUserOrders()
    {
        var userId = GetCurrentUserId();
        var orders = await _orderService.GetUserOrdersAsync(userId);
        return Ok(orders);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(Guid id)
    {
        var userId = GetCurrentUserId();
        var order = await _orderService.GetOrderByIdAsync(userId, id);
        if (order == null)
        {
            return NotFound();
        }
        return Ok(order);
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
