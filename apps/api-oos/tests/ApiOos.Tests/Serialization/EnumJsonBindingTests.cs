namespace ApiOos.Tests.Serialization;

using System.Text.Json;
using System.Text.Json.Serialization;
using ApiOos.DTOs.Requests.Orders;
using ApiOos.Enums;
using FluentAssertions;
using Xunit;

/// <summary>
/// Guards the API's JSON contract: the web-shop sends enum-valued fields (e.g.
/// paymentMethod) as their string names. Program.cs registers a
/// JsonStringEnumConverter so those bind; without it the model binder rejects the
/// request with a 400. These tests pin that behaviour at the serialization seam.
/// </summary>
public class EnumJsonBindingTests
{
    private static readonly JsonSerializerOptions Options = CreateOptions();

    private static JsonSerializerOptions CreateOptions()
    {
        // Mirror the controller JSON options configured in Program.cs.
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }

    [Theory]
    [InlineData("CashOnDelivery", PaymentMethod.CashOnDelivery)]
    [InlineData("CreditCard", PaymentMethod.CreditCard)]
    public void CreateOrderRequest_binds_paymentMethod_from_string(string value, PaymentMethod expected)
    {
        var json = $$"""
        {
          "shippingAddress": {
            "recipientName": "Demo", "street": "1 St", "city": "Baguio",
            "province": "Benguet", "postalCode": "2600", "phone": "09171234567"
          },
          "paymentMethod": "{{value}}"
        }
        """;

        var request = JsonSerializer.Deserialize<CreateOrderRequest>(json, Options);

        request.Should().NotBeNull();
        request!.PaymentMethod.Should().Be(expected);
        request.ShippingAddress.City.Should().Be("Baguio");
    }

    [Fact]
    public void PaymentMethod_serializes_as_string_name()
    {
        var json = JsonSerializer.Serialize(PaymentMethod.CashOnDelivery, Options);
        json.Should().Be("\"CashOnDelivery\"");
    }
}
