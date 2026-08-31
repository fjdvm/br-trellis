namespace ApiOos.Tests.Controllers;

using ApiOos.Controllers;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.DTOs.Responses.Orders;
using ApiOos.Interfaces.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Xunit;

public class OrderSyncControllerTests
{
    [Fact]
    public async Task GetRecentOrders_UsesWatermarkAndReturnsCustomerAttributedSnapshots()
    {
        var since = DateTime.UtcNow.AddMinutes(-5);
        var snapshot = new OrderSyncDto { CustomerId = Guid.NewGuid(), OrderNumber = "ORD-100" };
        var service = new FakeOrderService { SyncOrders = [snapshot] };
        var controller = new OrderSyncController(service);

        var result = await controller.GetRecentOrders(since);

        service.ReceivedSince.Should().Be(since);
        result.Result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeEquivalentTo(new List<OrderSyncDto> { snapshot });
    }

    [Fact]
    public async Task GetRecentOrders_WithoutWatermark_ReturnsBadRequest()
    {
        var controller = new OrderSyncController(new FakeOrderService());

        var result = await controller.GetRecentOrders(null);

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    private sealed class FakeOrderService : IOrderService
    {
        public DateTime? ReceivedSince { get; private set; }
        public List<OrderSyncDto> SyncOrders { get; init; } = [];

        public Task<CheckoutSummaryDto> CalculateCheckoutSummaryAsync(Guid userId) => throw new NotImplementedException();
        public Task<OrderDto> CreateOrderAsync(Guid userId, CreateOrderRequest request) => throw new NotImplementedException();
        public Task<OrderDto?> GetOrderByIdAsync(Guid userId, Guid orderId) => throw new NotImplementedException();
        public Task<List<OrderDto>> GetUserOrdersAsync(Guid userId) => throw new NotImplementedException();

        public Task<List<OrderSyncDto>> GetOrdersForAnalyticsSyncAsync(DateTime since)
        {
            ReceivedSince = since;
            return Task.FromResult(SyncOrders);
        }
    }
}
