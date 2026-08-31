namespace ApiOos.Services;

using ApiOos.Data;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.DTOs.Responses.Orders;
using ApiOos.Enums;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Mappers;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;


public class OrderService : IOrderService
{
    private readonly ICartRepository _cartRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly AppDbContext _context;
    private static readonly decimal FlatShippingFee = 100.00m;
    private static readonly decimal TaxRate = 0.00m;

    public OrderService(
        ICartRepository cartRepository,
        IOrderRepository orderRepository,
        AppDbContext context)
    {
        _cartRepository = cartRepository;
        _orderRepository = orderRepository;
        _context = context;
    }

    public async Task<CheckoutSummaryDto> CalculateCheckoutSummaryAsync(Guid userId)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart == null || !cart.Items.Any())
        {
            return new CheckoutSummaryDto
            {
                Subtotal = 0,
                ShippingFee = 0,
                Tax = 0,
                TotalAmount = 0,
                TotalItems = 0
            };
        }

        var subtotal = cart.Items.Sum(i => (i.Product?.Price ?? 0) * i.Quantity);
        var tax = subtotal * TaxRate;
        var totalAmount = subtotal + FlatShippingFee + tax;

        return new CheckoutSummaryDto
        {
            Subtotal = subtotal,
            ShippingFee = FlatShippingFee,
            Tax = tax,
            TotalAmount = totalAmount,
            TotalItems = cart.Items.Sum(i => i.Quantity)
        };
    }

    public async Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderRequest request)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId);
        if (cart == null || !cart.Items.Any())
        {
            throw new InvalidOperationException("Cannot checkout with an empty cart.");
        }

        // Validate stock
        foreach (var item in cart.Items)
        {
            if (item.Product == null || !item.Product.IsActive)
            {
                throw new InvalidOperationException($"Product '{item.Product?.Name}' is no longer available.");
            }
            if (item.Quantity > item.Product.Stock)
            {
                throw new InvalidOperationException($"Insufficient stock for '{item.Product.Name}'. Stock available: {item.Product.Stock}.");
            }
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var subtotal = cart.Items.Sum(i => i.Product.Price * i.Quantity);
            var tax = subtotal * TaxRate;
            var totalAmount = subtotal + FlatShippingFee + tax;
            var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";

            var order = new Order
            {
                OrderNumber = orderNumber,
                UserId = userId,
                Status = OrderStatus.Processing,
                ShippingRecipientName = request.ShippingAddress.RecipientName,
                ShippingStreet = request.ShippingAddress.Street,
                ShippingCity = request.ShippingAddress.City,
                ShippingProvince = request.ShippingAddress.Province,
                ShippingPostalCode = request.ShippingAddress.PostalCode,
                ShippingPhone = request.ShippingAddress.Phone,
                Subtotal = subtotal,
                ShippingFee = FlatShippingFee,
                Tax = tax,
                TotalAmount = totalAmount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var cartItem in cart.Items)
            {
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = cartItem.ProductId,
                    ProductName = cartItem.Product.Name,
                    ProductSKU = cartItem.Product.SKU,
                    UnitPrice = cartItem.Product.Price,
                    Quantity = cartItem.Quantity
                };
                order.Items.Add(orderItem);

                // Decrement stock
                cartItem.Product.Stock -= cartItem.Quantity;
                cartItem.Product.UpdatedAt = DateTime.UtcNow;
            }

            var payment = new Payment
            {
                OrderId = order.Id,
                PaymentMethod = request.PaymentMethod,
                Status = request.PaymentMethod == PaymentMethod.CashOnDelivery ? PaymentStatus.Pending : PaymentStatus.Paid,
                TransactionId = $"TXN-{Guid.NewGuid().ToString("N")[..12].ToUpper()}",
                Amount = totalAmount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            order.Payment = payment;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Clear cart
            await _cartRepository.ClearCartAsync(cart.Id);

            await transaction.CommitAsync();

            return OrderMapper.ToDto(order);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<OrderDto?> GetOrderByIdAsync(Guid userId, Guid orderId)
    {
        var order = await _orderRepository.GetByIdAsync(orderId, userId);
        return order != null ? OrderMapper.ToDto(order) : null;
    }

    public async Task<List<OrderDto>> GetUserOrdersAsync(Guid userId)
    {
        var orders = await _orderRepository.GetByUserIdAsync(userId);
        return orders.Select(OrderMapper.ToDto).ToList();
    }
}
