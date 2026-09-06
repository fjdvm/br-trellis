namespace ApiOos.Services;

using ApiOos.Data;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.DTOs.Responses.Orders;
using ApiOos.DTOs.Webhooks;
using ApiOos.Enums;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Mappers;
using ApiOos.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


public class OrderService : IOrderService
{
    private readonly ICartRepository _cartRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IEcommerceWebhookClient _ecommerceWebhookClient;
    private readonly ILogger<OrderService>? _logger;
    private static readonly decimal FlatShippingFee = 100.00m;
    private static readonly decimal TaxRate = 0.00m;

    public OrderService(
        ICartRepository cartRepository,
        IOrderRepository orderRepository,
        AppDbContext context,
        IUserRepository userRepository,
        IEcommerceWebhookClient ecommerceWebhookClient,
        ILogger<OrderService>? logger = null)
    {
        _cartRepository = cartRepository;
        _orderRepository = orderRepository;
        _context = context;
        _userRepository = userRepository;
        _ecommerceWebhookClient = ecommerceWebhookClient;
        _logger = logger;
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

        // Determine which cart items to order. When SelectedItemIds is provided
        // and non-empty, only those items are checked out; otherwise the whole
        // cart is ordered (backward compatible).
        var hasSelection = request.SelectedItemIds != null && request.SelectedItemIds.Count > 0;
        var selectedIds = hasSelection
            ? new HashSet<Guid>(request.SelectedItemIds!)
            : null;
        var itemsToOrder = selectedIds == null
            ? cart.Items.ToList()
            : cart.Items.Where(i => selectedIds.Contains(i.Id)).ToList();

        if (!itemsToOrder.Any())
        {
            throw new InvalidOperationException("No matching cart items were selected for checkout.");
        }

        // Validate stock (only for the items being ordered)
        foreach (var item in itemsToOrder)
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
            var subtotal = itemsToOrder.Sum(i => i.Product.Price * i.Quantity);
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

            foreach (var cartItem in itemsToOrder)
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

            // Remove only the ordered items from the cart. If every item was
            // ordered, clear the whole cart; otherwise keep the unselected items.
            if (itemsToOrder.Count == cart.Items.Count)
            {
                await _cartRepository.ClearCartAsync(cart.Id);
            }
            else
            {
                foreach (var orderedItem in itemsToOrder)
                {
                    await _cartRepository.RemoveItemAsync(orderedItem.Id);
                }
            }

            await transaction.CommitAsync();

            var orderDto = OrderMapper.ToDto(order);
            await DispatchOrderCreatedAsync(order, userId);
            return orderDto;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Sends an <c>order.created</c> event to api-crms's Ecommerce webhook. The
    /// event carries the customer's email (no ContactId) so api-crms resolves the
    /// Contact via Identity Resolution. Delivery failures are logged, never thrown —
    /// api-crms is a passive receiver and must not be able to fail checkout.
    /// </summary>
    private async Task DispatchOrderCreatedAsync(Order order, Guid userId)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(userId);
            var webhookEvent = new EcommerceWebhookEvent
            {
                EventId = Guid.NewGuid().ToString(),
                EventType = "order.created",
                Data = new EcommerceWebhookData
                {
                    OrderId = order.OrderNumber,
                    CustomerEmail = user?.Email,
                    // Carry the shopper's name so api-crms can name an order-first
                    // Contact instead of leaving it "unnamed".
                    Name = user?.FullName,
                    Status = MapOrderStatus(order.Status),
                    Total = order.TotalAmount,
                    RefundedAmount = 0m,
                    OccurredAt = order.CreatedAt.ToUniversalTime().ToString("O"),
                    LineItems = order.Items.Select(item => new EcommerceWebhookLineItem
                    {
                        ProductId = item.ProductId.ToString(),
                        ProductName = item.ProductName,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                    }).ToList(),
                },
            };

            await _ecommerceWebhookClient.SendAsync(webhookEvent);
        }
        catch (Exception exception)
        {
            _logger?.LogWarning(
                exception,
                "Failed to deliver order.created webhook for order {OrderNumber} to api-crms.",
                order.OrderNumber);
        }
    }

    private static string MapOrderStatus(OrderStatus status) => status switch
    {
        OrderStatus.Processing => "pending",
        OrderStatus.Shipped => "shipped",
        OrderStatus.Delivered => "delivered",
        OrderStatus.Cancelled => "pending",
        _ => "pending",
    };

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
