namespace ApiOos.DTOs.Requests.Orders;

using ApiOos.Enums;

public class ShippingAddressRequest
{
    public string RecipientName { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class CreateOrderRequest
{
    public ShippingAddressRequest ShippingAddress { get; set; } = null!;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.CashOnDelivery;

    /// <summary>
    /// Ids of the cart items to check out. When null or empty, the entire cart
    /// is ordered (backward compatible). When provided, only these items are
    /// ordered and removed from the cart; the remaining items stay in the cart.
    /// </summary>
    public List<Guid>? SelectedItemIds { get; set; }
}
