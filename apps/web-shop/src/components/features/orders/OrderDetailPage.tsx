"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, MapPin, Package, Truck, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ordersApi } from "@/lib/api/orders-api";
import type { OrderDto } from "@/types/order";

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && token) {
      ordersApi.getOrderById(orderId, token)
        .then((res) => {
          setOrder(res);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load order detail");
          setLoading(false);
        });
    }
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-sans text-xs text-on-surface-variant mt-2">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 text-center space-y-4">
        <Package className="w-16 h-16 text-outline mx-auto" />
        <h1 className="font-serif text-3xl text-primary">Order Not Found</h1>
        <p className="font-sans text-on-surface-variant text-sm max-w-md mx-auto">
          {error || "We couldn't find the requested order."}
        </p>
        <Button asChild className="rounded-full bg-primary text-on-primary px-8 py-3">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </div>
    );
  }

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
    <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-8 bg-surface font-sans">
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-container transition-all bg-surface-container-lowest hover:bg-surface-container-high px-5 py-2.5 rounded-full border border-outline-variant/30 shadow-2xs mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order History</span>
        </Link>
        <h1 className="headline-xl font-serif text-primary mb-1">
          Order #{order.orderNumber}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant">
          Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Status & Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status Banner */}
          <div className="bg-primary-fixed-dim/20 rounded-2xl p-6 border border-primary-fixed-dim/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-serif font-bold text-lg text-primary">Status: {order.status}</h3>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <p className="font-sans text-xs text-on-surface-variant">
                Estimated delivery: 2–4 business days
              </p>
            </div>
          </div>

          {/* Items Purchased List */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="font-serif font-bold text-xl text-primary mb-6 border-b border-outline-variant/20 pb-4">
              Items Purchased
            </h2>
            <div className="space-y-4 divide-y divide-outline-variant/20">
              {order.items.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-base text-on-surface truncate">{item.productName}</h4>
                    <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                      SKU: {item.productSKU} · Qty: {item.quantity} × ₱{item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-sans font-bold text-primary text-base">
                      ₱{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Shipping Details */}
        <div className="lg:col-span-4 space-y-6">
          {/* Order Summary */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 font-sans text-xs">
            <h2 className="font-serif font-bold text-xl text-primary border-b border-outline-variant/20 pb-4">
              Order Summary
            </h2>
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-bold text-on-surface">₱{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Shipping Fee</span>
              <span className="font-bold text-on-surface">₱{order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tax</span>
              <span className="font-bold text-on-surface">₱{order.tax.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center text-sm font-bold">
              <span className="font-serif text-primary">Total Paid</span>
              <span className="text-primary text-lg">₱{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 font-sans text-xs">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/20 pb-3">
              <MapPin className="w-4 h-4" />
              <h3 className="font-serif font-bold text-base">Shipping Details</h3>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface block text-sm">{order.shippingRecipientName || "Valued Customer"}</strong>
              {order.shippingStreet}<br />
              {order.shippingCity}, {order.shippingProvince} {order.shippingPostalCode}<br />
              Phone: {order.shippingPhone}
            </p>
          </div>

          {/* Payment Method */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3 font-sans text-xs">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/20 pb-3">
              <CreditCard className="w-4 h-4" />
              <h3 className="font-serif font-bold text-base">Payment Method</h3>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Method</span>
              <span className="font-bold text-on-surface">
                {order.paymentMethod === "CashOnDelivery" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Status</span>
              <span className="font-bold text-primary">{order.paymentStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
