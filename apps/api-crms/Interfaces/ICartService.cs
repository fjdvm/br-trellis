using api_crms.DTOs;
using api_crms.Enums;

namespace api_crms.Interfaces;

public interface ICartService
{
    Task<IReadOnlyList<CartListItemDto>> ListCartsAsync(CartStatus? status, CancellationToken cancellationToken);
}
