using ApiOos.Authorization;
using ApiOos.DTOs.Responses.Orders;
using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ApiOos.Controllers;

[ApiController]
[Route("api/orders/sync")]
[Authorize(Policy = CrmSyncTokenRequirement.PolicyName)]
public class OrderSyncController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderSyncDto>>> GetRecentOrders([FromQuery] DateTime? since)
    {
        if (!since.HasValue)
            return BadRequest("The since query parameter is required.");

        var orders = await orderService.GetOrdersForAnalyticsSyncAsync(since.Value.ToUniversalTime());
        return Ok(orders);
    }
}
