using System.Text.Json;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Interfaces;
using api_crms.Models;

namespace api_crms.Services;

public sealed class EcommerceIngestionService(
    IEcommerceRepository ecommerceRepository) : IEcommerceIngestionService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<bool> ProcessEventAsync(
        string eventId,
        string eventType,
        string payload,
        CancellationToken cancellationToken = default)
    {
        if (await ecommerceRepository.HasProcessedEventAsync(eventId, cancellationToken))
        {
            return false; // Already processed (dedup)
        }

        var webhookPayload = JsonSerializer.Deserialize<EcommerceWebhookPayload>(payload, JsonOptions)
            ?? throw new InvalidOperationException("Invalid webhook payload.");

        var data = webhookPayload.Data;

        switch (eventType)
        {
            case "order.created":
            case "order.updated":
                await ProcessOrderEventAsync(data, eventType, cancellationToken);
                break;
            case "order.refunded":
                await ProcessOrderRefundedAsync(data, cancellationToken);
                break;
            case "cart.updated":
                await ProcessCartUpdatedAsync(data, cancellationToken);
                break;
            case "product.updated":
                await ProcessProductUpdatedAsync(data, cancellationToken);
                break;
            default:
                throw new InvalidOperationException($"Unknown event type: {eventType}");
        }

        await ecommerceRepository.MarkEventProcessedAsync(eventId, eventType, cancellationToken);
        return true;
    }

    private async Task ProcessOrderEventAsync(
        EcommerceEventData data, string eventType, CancellationToken cancellationToken)
    {
        var contactId = ParseGuid(data.ContactId, "ContactId");
        var now = ParseTimestamp(data.OccurredAt);

        var status = ParseOrderStatus(data.Status);
        var order = new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = data.OrderId ?? throw new InvalidOperationException("OrderId is required."),
            ContactId = contactId,
            Status = status,
            Total = data.Total ?? 0m,
            RefundedAmount = data.RefundedAmount ?? 0m,
            CreatedAt = now,
            UpdatedAt = now,
        };

        if (data.LineItems is not null)
        {
            foreach (var item in data.LineItems)
            {
                order.LineItems.Add(new OrderLineItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                });
            }
        }

        await ecommerceRepository.UpsertOrderAsync(order, cancellationToken);
        await ecommerceRepository.RecalculateLifetimeValueAsync(contactId, cancellationToken);

        await WriteOrderTimelineEntryAsync(
            contactId, data.OrderId!, eventType, status, data.Total ?? 0m, now, cancellationToken);
    }

    private async Task ProcessOrderRefundedAsync(
        EcommerceEventData data, CancellationToken cancellationToken)
    {
        var contactId = ParseGuid(data.ContactId, "ContactId");
        var now = ParseTimestamp(data.OccurredAt);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            PlatformOrderId = data.OrderId ?? throw new InvalidOperationException("OrderId is required."),
            ContactId = contactId,
            Status = OrderStatus.Refunded,
            Total = data.Total ?? 0m,
            RefundedAmount = data.RefundedAmount ?? 0m,
            CreatedAt = now,
            UpdatedAt = now,
        };

        if (data.LineItems is not null)
        {
            foreach (var item in data.LineItems)
            {
                order.LineItems.Add(new OrderLineItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                });
            }
        }

        await ecommerceRepository.UpsertOrderAsync(order, cancellationToken);
        await ecommerceRepository.RecalculateLifetimeValueAsync(contactId, cancellationToken);

        await WriteOrderTimelineEntryAsync(
            contactId, data.OrderId!, "order.refunded", OrderStatus.Refunded,
            data.RefundedAmount ?? 0m, now, cancellationToken);
    }

    private async Task ProcessCartUpdatedAsync(
        EcommerceEventData data, CancellationToken cancellationToken)
    {
        var now = ParseTimestamp(data.OccurredAt);
        Guid? contactId = string.IsNullOrWhiteSpace(data.ContactId)
            ? null
            : ParseGuid(data.ContactId, "ContactId");

        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = data.CartId ?? throw new InvalidOperationException("CartId is required."),
            ContactId = contactId,
            Status = CartStatus.Active,
            LastActivityAt = now,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var items = (data.Items ?? []).Select(item => new CartItem
        {
            Id = Guid.NewGuid(),
            ProductId = item.ProductId,
            ProductName = item.ProductName,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
        }).ToList();

        await ecommerceRepository.UpsertCartAsync(cart, items, cancellationToken);
    }

    private async Task ProcessProductUpdatedAsync(
        EcommerceEventData data, CancellationToken cancellationToken)
    {
        var now = ParseTimestamp(data.OccurredAt);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            PlatformProductId = data.ProductId
                ?? throw new InvalidOperationException("ProductId is required."),
            Name = data.Name ?? string.Empty,
            Price = data.Price ?? 0m,
            InStock = data.InStock ?? false,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await ecommerceRepository.UpsertProductAsync(product, cancellationToken);
    }

    private async Task WriteOrderTimelineEntryAsync(
        Guid contactId,
        string orderId,
        string eventType,
        OrderStatus status,
        decimal amount,
        DateTimeOffset occurredAt,
        CancellationToken cancellationToken)
    {
        var summary = eventType switch
        {
            "order.created" => $"Order {orderId} created — {status}, total ${amount:F2}",
            "order.updated" => $"Order {orderId} updated — status: {status}",
            "order.refunded" => $"Order {orderId} refunded — ${amount:F2}",
            _ => $"Order {orderId} — {eventType}",
        };

        var entry = new TimelineEntry
        {
            Id = Guid.NewGuid(),
            ContactId = contactId,
            SourceModule = "ecommerce",
            EntryType = eventType,
            Summary = summary,
            OccurredAt = occurredAt,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        await ecommerceRepository.AddTimelineEntryAsync(entry, cancellationToken);
    }

    private static Guid ParseGuid(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value) || !Guid.TryParse(value, out var result))
            throw new InvalidOperationException($"{fieldName} is required and must be a valid GUID.");
        return result;
    }

    private static OrderStatus ParseOrderStatus(string? status)
    {
        return status?.ToLowerInvariant() switch
        {
            "pending" => OrderStatus.Pending,
            "paid" => OrderStatus.Paid,
            "shipped" => OrderStatus.Shipped,
            "delivered" => OrderStatus.Delivered,
            "refunded" => OrderStatus.Refunded,
            _ => OrderStatus.Pending,
        };
    }

    private static DateTimeOffset ParseTimestamp(string? timestamp)
    {
        if (DateTimeOffset.TryParse(timestamp, out var result))
            return result;
        return DateTimeOffset.UtcNow;
    }
}
