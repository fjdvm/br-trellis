using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class OrderMapper
{
    public static IReadOnlyList<OrderListItemDto> ToListItems(IEnumerable<Order> orders)
    {
        return orders.Select(order => new OrderListItemDto(
            order.Id,
            order.PlatformOrderId,
            order.ContactId,
            order.Contact?.Name,
            order.Contact?.Email,
            order.Status.ToString(),
            order.Total,
            order.RefundedAmount,
            order.CreatedAt,
            order.LineItems.Count
        )).ToList();
    }
}
