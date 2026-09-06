using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class OrderService(IOrderRepository orderRepository) : IOrderService
{
    public async Task<IReadOnlyList<OrderListItemDto>> ListOrdersAsync(CancellationToken cancellationToken)
    {
        var orders = await orderRepository.ListOrdersAsync(cancellationToken);
        return OrderMapper.ToListItems(orders);
    }
}
