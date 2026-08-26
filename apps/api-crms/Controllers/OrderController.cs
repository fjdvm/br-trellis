using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/orders")]
public sealed class OrderController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderListItemDto>>> ListOrders(
        CancellationToken cancellationToken)
    {
        return Ok(await orderService.ListOrdersAsync(cancellationToken));
    }
}
