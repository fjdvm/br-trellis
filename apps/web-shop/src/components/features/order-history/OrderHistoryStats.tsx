"use client";

import { Package, Wallet, Truck, CheckCircle2 } from "lucide-react";
import { computeStats, formatCurrency } from "./order-history-utils";
import type { OrderDto } from "@/types/order";

interface OrderHistoryStatsProps {
  orders: OrderDto[];
}

/** Row of summary cards giving an at-a-glance overview of the order history. */
export function OrderHistoryStats({ orders }: OrderHistoryStatsProps) {
  const stats = computeStats(orders);

  const cards = [
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      icon: Package,
    },
    {
      label: "Total Spent",
      value: formatCurrency(stats.totalSpent),
      icon: Wallet,
    },
    {
      label: "In Progress",
      value: String(stats.activeOrders),
      icon: Truck,
    },
    {
      label: "Delivered",
      value: String(stats.deliveredOrders),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-surface-container-lowest border border-outline-variant/30 shadow-xs p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 bg-primary-fixed/40 flex items-center justify-center text-primary shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-sm text-on-surface-variant">{card.label}</p>
              <p className="font-serif font-bold text-xl text-on-surface truncate">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
