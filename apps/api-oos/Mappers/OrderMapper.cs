namespace ApiOos.Mappers;

using ApiOos.DTOs.Responses.Orders;
using ApiOos.Models;

public static class OrderMapper
{
    public static OrderDto ToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Status = order.Status.ToString(),
            ShippingRecipientName = order.ShippingRecipientName,
            ShippingStreet = order.ShippingStreet,
            ShippingCity = order.ShippingCity,
            ShippingProvince = order.ShippingProvince,
            ShippingPostalCode = order.ShippingPostalCode,
            ShippingPhone = order.ShippingPhone,
            Subtotal = order.Subtotal,
            ShippingFee = order.ShippingFee,
            Tax = order.Tax,
            TotalAmount = order.TotalAmount,
            PaymentMethod = order.Payment?.PaymentMethod.ToString() ?? "Unknown",
            PaymentStatus = order.Payment?.Status.ToString() ?? "Pending",
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(ToItemDto).ToList()
        };
    }

    public static OrderItemDto ToItemDto(OrderItem item)
    {
        return new OrderItemDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.ProductName,
            ProductSKU = item.ProductSKU,
            UnitPrice = item.UnitPrice,
            Quantity = item.Quantity,
            TotalPrice = item.TotalPrice
        };
    }
}
