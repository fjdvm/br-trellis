"use client";

import Link from "next/link";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";

export function ProfileOrdersTab() {
  const { orders, loading, error } = useOrders();

  const getStatusBadge = (status: string) => {
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
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-4 border-b border-outline-variant/20">
        <h2 className="font-serif font-bold text-2xl text-primary">Order History</h2>
        <p className="font-sans text-xs text-on-surface-variant mt-1">
          Review your past artisanal selections and track current deliveries.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-error-container/30 text-on-error-container text-xs border border-error-container font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-sans text-xs text-on-surface-variant mt-2">Loading order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Package className="w-12 h-12 text-outline mx-auto" />
          <h3 className="font-serif font-bold text-lg text-on-surface">No orders found</h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto">
            When you place an order for our handcrafted Ube treats, it will appear here.
          </p>
          <Button asChild className="rounded-full bg-primary text-white font-semibold px-8 py-3 hover:bg-primary-container">
            <Link href="/products">Browse Artisanal Collection</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="group block bg-surface-container-low p-6 border border-outline-variant/30 hover:border-primary/40 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-grow">
                  <div>
                    <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">
                      ORDER NUMBER
                    </span>
                    <span className="font-serif font-bold text-lg text-on-surface">
                      #{order.orderNumber}
                    </span>
                  </div>

                  <div className="hidden md:block w-px h-10 bg-outline-variant/20"></div>

                  <div>
                    <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">
                      DATE
                    </span>
                    <span className="font-sans text-xs font-semibold text-on-surface">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="hidden md:block w-px h-10 bg-outline-variant/20"></div>

                  <div>
                    <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">
                      TOTAL
                    </span>
                    <span className="font-sans text-sm font-bold text-primary">
                      ₱{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
