using api_crms.Models;

namespace api_crms.Interfaces;

public interface IOrderRepository
{
    Task<IReadOnlyList<Order>> ListOrdersAsync(CancellationToken cancellationToken);
}
