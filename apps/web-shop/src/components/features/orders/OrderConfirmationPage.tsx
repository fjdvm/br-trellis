"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, Truck, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ordersApi } from "@/lib/api/orders-api";
import type { OrderDto } from "@/types/order";

export function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(!!(orderId && token));

  useEffect(() => {
    if (!orderId || !token) return;
    let cancelled = false;
    ordersApi.getOrderById(orderId, token)
      .then((res) => { if (!cancelled) setOrder(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-sans text-xs text-on-surface-variant mt-3">Retrieving order confirmation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-container/20 text-primary mb-6">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal mb-2">
          Thank you for your order.
        </h1>
        {order ? (
          <p className="font-sans text-sm sm:text-base text-on-surface-variant">
            Order <span className="font-bold text-on-surface">#{order.orderNumber}</span> has been confirmed.
          </p>
        ) : (
          <p className="font-sans text-sm sm:text-base text-on-surface-variant">
            Your purchase has been confirmed.
          </p>
        )}
      </div>

      {order && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 sm:p-10 shadow-xs mb-8 space-y-6">
          <h2 className="font-serif font-bold text-xl text-primary border-b border-outline-variant/20 pb-4">
            Order Summary
          </h2>

          <div className="space-y-4 font-sans text-sm">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-b-0">
                <div>
                  <h4 className="font-serif font-bold text-on-surface">{item.productName}</h4>
                  <p className="font-sans text-xs text-on-surface-variant">Qty: {item.quantity} × ₱{item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="font-bold text-primary">₱{item.totalPrice.toFixed(2)}</span>
              </div>
            ))}

            <div className="pt-4 border-t border-outline-variant/20 space-y-2">
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>Subtotal</span>
                <span className="font-bold text-on-surface">₱{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>Shipping Fee</span>
                <span className="font-bold text-on-surface">₱{order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-xs">
                <span>Tax</span>
                <span className="font-bold text-on-surface">₱0.00</span>
              </div>
              <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center text-base font-bold">
                <span className="font-serif text-primary">Total</span>
                <span className="text-primary text-xl">₱{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {order && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 font-sans">
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
            <div className="flex items-center gap-2.5 mb-3 text-primary">
              <Truck className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base">Estimated Delivery</h3>
            </div>
            <p className="font-sans text-lg font-bold text-on-surface mb-1">2 – 4 Business Days</p>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              Fresh Baguio Ube treats dispatched directly to your doorstep.
            </p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
            <div className="flex items-center gap-2.5 mb-3 text-primary">
              <MapPin className="w-5 h-5" />
              <h3 className="font-serif font-bold text-base">Shipping Address</h3>
            </div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">{order.shippingRecipientName || "Valued Customer"}</strong><br />
              {order.shippingStreet}, {order.shippingCity}<br />
              {order.shippingProvince} {order.shippingPostalCode}<br />
              {order.shippingPhone}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center font-sans">
        {order && (
          <Button asChild variant="outline" className="rounded-full px-8 py-3 text-xs font-semibold border-outline-variant/40 hover:bg-surface-container">
            <Link href={`/orders/${order.id}`}>View Order Details</Link>
          </Button>
        )}
        <Button asChild className="rounded-full px-8 py-3 bg-primary text-on-primary font-semibold hover:bg-primary-container shadow-sm">
          <Link href="/products" className="flex items-center justify-center gap-2">
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
