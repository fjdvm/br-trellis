"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Loader2, Lock } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { OrderHistoryStats } from "./OrderHistoryStats";
import { OrderHistoryTable } from "./OrderHistoryTable";
import {
  ORDER_STATUS_FILTERS,
  type OrderStatusFilter,
} from "./order-history-utils";

/**
 * Standalone, detailed order history page. Separate from the compact order
 * history shown in Account settings (ProfileOrdersTab) — this view adds summary
 * stats, status filtering, and a rich per-order table.
 */
export function OrderHistoryPage() {
  const { orders, loading, error, isAuthenticated } = useOrders();
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("All");

  const filteredOrders = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (statusFilter === "All") return sorted;
    return sorted.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-8 font-sans">
      {/* Page header */}
      <div className="pb-4 border-b border-outline-variant/20">
        <h1 className="font-serif font-bold text-3xl text-primary">Order History</h1>
        <p className="font-sans text-sm text-on-surface-variant mt-1">
          A detailed record of every order — statuses, recipients, payments, and totals.
        </p>
      </div>

      {!isAuthenticated && !loading ? (
        <div className="text-center py-16 space-y-4">
          <Lock className="w-12 h-12 text-outline mx-auto" />
          <h2 className="font-serif font-bold text-lg text-on-surface">Please sign in</h2>
          <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto">
            Sign in to view your detailed order history.
          </p>
          <Button
            asChild
            className="rounded-full bg-primary text-white font-semibold px-8 py-3 hover:bg-primary-container"
          >
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-error-container/30 text-on-error-container text-sm border border-error-container font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="font-sans text-sm text-on-surface-variant mt-2">
                Loading order history...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Package className="w-12 h-12 text-outline mx-auto" />
              <h2 className="font-serif font-bold text-lg text-on-surface">No orders yet</h2>
              <p className="font-sans text-sm text-on-surface-variant max-w-sm mx-auto">
                When you place an order for our handcrafted Ube treats, it will appear here.
              </p>
              <Button
                asChild
                className="rounded-full bg-primary text-white font-semibold px-8 py-3 hover:bg-primary-container"
              >
                <Link href="/products">Browse Artisanal Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <OrderHistoryStats orders={orders} />

              {/* Status filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-sm font-semibold text-on-surface-variant mr-1">
                  Filter:
                </span>
                {ORDER_STATUS_FILTERS.map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary text-white shadow-xs"
                          : "bg-surface-container-low text-on-surface-variant hover:text-primary hover:bg-surface-container"
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 border border-outline-variant/30 rounded-lg">
                  <p className="font-sans text-sm text-on-surface-variant">
                    No orders match the selected status.
                  </p>
                </div>
              ) : (
                <OrderHistoryTable orders={filteredOrders} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
