namespace ApiOos.Controllers;

using ApiOos.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/tickets")]
public class TicketsController : ControllerBase
{
    private readonly ISentraCxService _sentraCxService;

    public TicketsController(ISentraCxService sentraCxService)
    {
        _sentraCxService = sentraCxService;
    }

    [HttpGet]
    public async Task<IActionResult> GetTickets([FromQuery] string? customerId)
    {
        var query = !string.IsNullOrEmpty(customerId) ? $"?customerId={customerId}" : "";
        var json = await _sentraCxService.ProxyGetAsync($"/api/v1/tickets{query}");
        return Content(json, "application/json");
    }

    [HttpGet("{ticketId}")]
    public async Task<IActionResult> GetTicketDetails(string ticketId)
    {
        var json = await _sentraCxService.ProxyGetAsync($"/api/v1/tickets/{ticketId}");
        return Content(json, "application/json");
    }

    [HttpGet("{ticketId}/messages")]
    public async Task<IActionResult> GetTicketMessages(string ticketId)
    {
        var json = await _sentraCxService.ProxyGetAsync($"/api/v1/tickets/{ticketId}/messages");
        return Content(json, "application/json");
    }

    [HttpPost]
    public async Task<IActionResult> CreateTicket([FromQuery] string? customerId, [FromBody] object body)
    {
        var query = !string.IsNullOrEmpty(customerId) ? $"?customerId={customerId}" : "";
        var (json, statusCode) = await _sentraCxService.ProxyPostAsync($"/api/v1/tickets{query}", body);
        return new ContentResult
        {
            Content = json,
            ContentType = "application/json",
            StatusCode = statusCode
        };
    }

    [HttpDelete("{ticketId}")]
    public async Task<IActionResult> CancelTicket(string ticketId)
    {
        var success = await _sentraCxService.ProxyDeleteAsync($"/api/v1/tickets/{ticketId}");
        if (success) return Ok();
        return BadRequest();
    }
}
