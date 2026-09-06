namespace ApiOos.Interfaces.Repositories;

using ApiOos.Models;

public interface IOrderRepository
{
    Task<Order> CreateOrderAsync(Order order);
    Task<Order?> GetByIdAsync(Guid orderId, Guid userId);
    Task<List<Order>> GetByUserIdAsync(Guid userId);
}