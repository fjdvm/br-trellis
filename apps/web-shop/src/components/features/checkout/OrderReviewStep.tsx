"use client";

import Image from "next/image";
import { ArrowLeft, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItemDto } from "@/types/cart";
import type { ShippingAddressRequest } from "@/types/order";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";

interface OrderReviewStepProps {
  items: CartItemDto[];
  shippingAddress: ShippingAddressRequest;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  onBack: () => void;
  onNext: () => void;
}

export function OrderReviewStep({
  items,
  shippingAddress,
  subtotal,
  shippingFee,
  totalAmount,
  onBack,
  onNext,
}: OrderReviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2 border-b border-outline-variant/20 pb-3">
        <ShoppingBag className="w-5 h-5 text-primary" />
        Review Your Order
      </h2>

      {/* Shipping Address Summary Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <MapPin className="w-4 h-4 text-primary" />
            Shipping To
          </div>
          <Button variant="ghost" size="sm" onClick={onBack} className="text-xs font-semibold text-primary h-7 px-3 rounded-lg hover:bg-primary/10">
            Change
          </Button>
        </div>
        <p className="font-sans text-xs font-bold text-on-surface">{shippingAddress.recipientName} ({shippingAddress.phone})</p>
        <p className="font-sans text-xs text-on-surface-variant">
          {shippingAddress.street}, {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}
        </p>
      </div>

      {/* Items List */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 space-y-3">
        <h3 className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          Items ({items.reduce((acc, i) => acc + i.quantity, 0)})
        </h3>

        <div className="divide-y divide-outline-variant/20">
          {items.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center gap-4">
              <div className="relative w-14 h-14 overflow-hidden bg-surface-variant shrink-0 border border-outline-variant/20">
                <Image
                  src={item.images?.[0] || DEFAULT_IMAGE}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  unoptimized={(item.images?.[0] || DEFAULT_IMAGE).startsWith("http")}
                />
              </div>

              <div className="flex-1 min-w-0 font-sans">
                <h4 className="font-serif font-bold text-sm text-on-surface truncate">{item.productName}</h4>
                <p className="text-xs text-on-surface-variant">
                  Qty: {item.quantity} × ₱{item.unitPrice.toFixed(2)}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-sans text-xs font-bold text-primary">
                  ₱{item.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-5 space-y-2.5 font-sans text-xs">
        <div className="flex justify-between text-on-surface-variant">
          <span>Items Subtotal</span>
          <span className="font-bold text-on-surface">₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Shipping Fee</span>
          <span className="font-bold text-on-surface">₱{shippingFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-on-surface-variant">
          <span>Tax</span>
          <span className="font-bold text-on-surface">₱0.00</span>
        </div>
        <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center text-sm font-bold">
          <span className="font-serif text-primary">Total</span>
          <span className="text-primary text-base">₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl px-6 py-2.5 text-xs font-semibold gap-2 border-outline-variant/40 hover:bg-surface-container">
          <ArrowLeft className="w-4 h-4" />
          Back to Shipping
        </Button>
        <Button type="button" onClick={onNext} className="rounded-xl px-8 py-2.5 bg-primary text-white font-semibold hover:bg-primary-container shadow-sm">
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}
