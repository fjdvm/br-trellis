using api_crms.DTOs;

namespace api_crms.Interfaces;

public interface IOrderService
{
    Task<IReadOnlyList<OrderListItemDto>> ListOrdersAsync(CancellationToken cancellationToken);
}
