"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  orDash,
  statusBadgeClasses,
  totalItemCount,
} from "./order-history-utils";
import type { OrderDto } from "@/types/order";

interface OrderHistoryTableProps {
  orders: OrderDto[];
}

/**
 * Detailed, scrollable order history table. Every row navigates to the full
 * order detail page. Follows the repo table rules: per-column min widths, a
 * scrollable wrapper with a sticky header, and full-row click navigation.
 */
export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const router = useRouter();

  return (
    <div className="max-h-[600px] overflow-auto border border-border">
      <table className="w-full border-collapse text-base">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b border-outline-variant/40 text-left">
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary">
              Order #
            </th>
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary">
              Date
            </th>
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary">
              Status
            </th>
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary">
              Items
            </th>
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary">
              Recipient
            </th>
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary">
              Payment
            </th>
            <th className="min-w-[160px] px-4 py-3 font-serif font-bold text-primary text-right">
              Total
            </th>
            <th className="min-w-[48px] px-4 py-3" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="bg-surface-container border-b border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors"
            >
              <td className="px-4 py-3 font-semibold text-on-surface whitespace-nowrap">
                #{order.orderNumber}
              </td>
              <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                {formatDate(order.createdAt)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusBadgeClasses(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {totalItemCount(order)}
              </td>
              <td className="px-4 py-3 text-on-surface">
                <span className="block">{orDash(order.shippingRecipientName)}</span>
                <span className="block text-sm text-on-surface-variant">
                  {orDash(order.shippingCity)}
                  {order.shippingProvince ? `, ${order.shippingProvince}` : ""}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface">
                <span className="block">{formatPaymentMethod(order.paymentMethod)}</span>
                <span className="block text-sm text-on-surface-variant">
                  {orDash(order.paymentStatus)}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-bold text-primary whitespace-nowrap">
                {formatCurrency(order.totalAmount)}
              </td>
              <td className="px-4 py-3 text-right">
                <ChevronRight className="w-5 h-5 text-outline inline-block" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
