namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests.Orders;
using ApiOos.DTOs.Responses.Orders;

public interface IOrderService
{
    Task<CheckoutSummaryDto> CalculateCheckoutSummaryAsync(Guid userId);
    Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderRequest request);
    Task<OrderDto?> GetOrderByIdAsync(Guid userId, Guid orderId);
    Task<List<OrderDto>> GetUserOrdersAsync(Guid userId);
}