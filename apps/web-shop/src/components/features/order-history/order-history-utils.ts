import type { OrderDto, OrderStatus } from "@/types/order";

/** All selectable order statuses plus an "All" sentinel for the filter. */
export const ORDER_STATUS_FILTERS = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

/** Format a peso amount consistently with two decimal places (repo uses ₱). */
export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

/** Format a date as e.g. "Mar 5, 2026". Returns "—" for missing values. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a date with time for the detailed timeline, e.g. "Mar 5, 2026, 2:30 PM". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Show a value or an em-dash placeholder when empty. */
export function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

/** Human-friendly payment method label. */
export function formatPaymentMethod(method: string): string {
  switch (method) {
    case "CashOnDelivery":
      return "Cash on Delivery";
    case "CreditCard":
      return "Credit Card";
    case "MockPayment":
      return "Online Payment";
    default:
      return orDash(method);
  }
}

/** Tailwind classes for a status badge, matching the existing profile/detail styling. */
export function statusBadgeClasses(status: string): string {
  switch (status) {
    case "Delivered":
      return "bg-surface-variant text-on-surface-variant";
    case "Shipped":
      return "bg-primary-fixed text-primary";
    case "Processing":
      return "bg-secondary-container text-on-secondary-container";
    case "Cancelled":
      return "bg-error-container text-on-error-container";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

/** Total number of individual items across an order's line items. */
export function totalItemCount(order: OrderDto): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Aggregate stats across a list of orders for the summary cards. */
export interface OrderHistoryStatsData {
  totalOrders: number;
  totalSpent: number;
  activeOrders: number;
  deliveredOrders: number;
}

const ACTIVE_STATUSES: OrderStatus[] = ["Pending", "Processing", "Shipped"];

export function computeStats(orders: OrderDto[]): OrderHistoryStatsData {
  return orders.reduce<OrderHistoryStatsData>(
    (acc, order) => {
      acc.totalOrders += 1;
      acc.totalSpent += order.totalAmount;
      if (ACTIVE_STATUSES.includes(order.status)) acc.activeOrders += 1;
      if (order.status === "Delivered") acc.deliveredOrders += 1;
      return acc;
    },
    { totalOrders: 0, totalSpent: 0, activeOrders: 0, deliveredOrders: 0 }
  );
}
