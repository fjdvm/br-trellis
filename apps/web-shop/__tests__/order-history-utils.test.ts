import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  orDash,
  statusBadgeClasses,
  totalItemCount,
  computeStats,
} from "@/components/features/order-history/order-history-utils";
import type { OrderDto } from "@/types/order";

function makeOrder(overrides: Partial<OrderDto> = {}): OrderDto {
  return {
    id: "o1",
    orderNumber: "ORD-0001",
    status: "Pending",
    shippingRecipientName: "Demo Customer",
    shippingStreet: "123 Katipunan Ave",
    shippingCity: "Quezon City",
    shippingProvince: "Metro Manila",
    shippingPostalCode: "1108",
    shippingPhone: "+63 917 123 4567",
    subtotal: 42,
    shippingFee: 5,
    tax: 5.04,
    totalAmount: 52.04,
    paymentMethod: "CashOnDelivery",
    paymentStatus: "Pending",
    createdAt: "2026-03-05T12:00:00.000Z",
    items: [
      { id: "i1", productId: "p1", productName: "Ube Cream", productSKU: "UBE-CRM-001", unitPrice: 24, quantity: 1, totalPrice: 24 },
      { id: "i2", productId: "p2", productName: "Purple Yam Jam", productSKU: "UBE-JAM-002", unitPrice: 18, quantity: 1, totalPrice: 18 },
    ],
    ...overrides,
  };
}

describe("order-history-utils", () => {
  describe("formatCurrency", () => {
    it("formats with peso sign and two decimals", () => {
      expect(formatCurrency(52.04)).toBe("₱52.04");
      expect(formatCurrency(0)).toBe("₱0.00");
    });
  });

  describe("formatDate", () => {
    it("returns an em-dash for missing/invalid values", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("not-a-date")).toBe("—");
    });

    it("formats a valid ISO date", () => {
      expect(formatDate("2026-03-05T12:00:00.000Z")).toContain("2026");
    });
  });

  describe("orDash", () => {
    it("returns em-dash for empty/whitespace and the trimmed value otherwise", () => {
      expect(orDash("")).toBe("—");
      expect(orDash("   ")).toBe("—");
      expect(orDash(null)).toBe("—");
      expect(orDash("  Metro Manila  ")).toBe("Metro Manila");
    });
  });

  describe("formatPaymentMethod", () => {
    it("maps known payment methods to friendly labels", () => {
      expect(formatPaymentMethod("CashOnDelivery")).toBe("Cash on Delivery");
      expect(formatPaymentMethod("CreditCard")).toBe("Credit Card");
      expect(formatPaymentMethod("MockPayment")).toBe("Online Payment");
    });

    it("falls back to em-dash for unknown/empty methods", () => {
      expect(formatPaymentMethod("")).toBe("—");
    });
  });

  describe("statusBadgeClasses", () => {
    it("returns distinct classes per known status", () => {
      expect(statusBadgeClasses("Delivered")).toContain("surface-variant");
      expect(statusBadgeClasses("Cancelled")).toContain("error-container");
    });
  });

  describe("totalItemCount", () => {
    it("sums quantities across line items", () => {
      const order = makeOrder({
        items: [
          { id: "i1", productId: "p1", productName: "A", productSKU: "A", unitPrice: 1, quantity: 2, totalPrice: 2 },
          { id: "i2", productId: "p2", productName: "B", productSKU: "B", unitPrice: 1, quantity: 3, totalPrice: 3 },
        ],
      });
      expect(totalItemCount(order)).toBe(5);
    });
  });

  describe("computeStats", () => {
    it("aggregates totals, active, and delivered counts", () => {
      const orders = [
        makeOrder({ status: "Delivered", totalAmount: 100 }),
        makeOrder({ status: "Shipped", totalAmount: 50 }),
        makeOrder({ status: "Processing", totalAmount: 25 }),
        makeOrder({ status: "Cancelled", totalAmount: 10 }),
      ];
      const stats = computeStats(orders);
      expect(stats.totalOrders).toBe(4);
      expect(stats.totalSpent).toBe(185);
      expect(stats.activeOrders).toBe(2); // Shipped + Processing
      expect(stats.deliveredOrders).toBe(1);
    });

    it("returns zeroes for an empty list", () => {
      expect(computeStats([])).toEqual({
        totalOrders: 0,
        totalSpent: 0,
        activeOrders: 0,
        deliveredOrders: 0,
      });
    });
  });
});
