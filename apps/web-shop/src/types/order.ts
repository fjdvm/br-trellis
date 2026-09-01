export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentMethod = "CashOnDelivery" | "CreditCard" | "MockPayment";

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSKU: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  shippingRecipientName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingPhone: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItemDto[];
}

export interface CheckoutSummaryDto {
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  totalItems: number;
}

export interface ShippingAddressRequest {
  recipientName: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddressRequest;
  paymentMethod: PaymentMethod;
  /**
   * Ids of the cart items to check out. When omitted or empty, the entire cart
   * is ordered (backward compatible). When provided, only these items are
   * ordered and removed from the cart; the rest stay in the cart.
   */
  selectedItemIds?: string[];
}
