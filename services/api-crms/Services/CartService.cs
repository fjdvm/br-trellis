using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class CartService(ICartRepository cartRepository) : ICartService
{
    public async Task<IReadOnlyList<CartListItemDto>> ListCartsAsync(
        CartStatus? status, CancellationToken cancellationToken)
    {
        var carts = await cartRepository.ListCartsAsync(status, cancellationToken);
        var cartIds = carts.Select(c => c.Id).ToList();
        var workflowRuns = await cartRepository.GetActiveWorkflowRunsByEntityIdAsync(cartIds, cancellationToken);
        return CartMapper.ToListItems(carts, workflowRuns);
    }
}
