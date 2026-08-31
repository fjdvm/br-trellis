"use client";

import Link from "next/link";
import { ShoppingBag, X, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { CartItemRow } from "./CartItemRow";
import { EmptyCartState } from "./EmptyCartState";

export function CartSheet() {
  const {
    items,
    subtotal,
    totalItems,
    isOpen,
    loading,
    error,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Glassmorphism Backdrop */}
      <div
        className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeCart}
      />

      {/* Sheet Content Drawer */}
      <div className="relative ml-auto w-full max-w-md bg-surface/95 backdrop-blur-xl h-dvh shadow-2xl flex flex-col z-10 border-l border-outline-variant/30 animate-slide-left rounded-none overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/80">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-serif font-bold text-lg text-primary">
              Your Shopping Cart ({totalItems})
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeCart}
            className="rounded-none text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 m-4 bg-error-container/30 text-on-error-container text-xs rounded-none font-medium border border-error-container">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="font-sans text-xs text-on-surface-variant mt-2">Loading your cart...</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyCartState onClose={closeCart} />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-outline-variant/30 bg-surface-container-low/80 space-y-4">
            <div className="space-y-1.5 font-sans">
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-serif font-bold text-primary text-lg">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                asChild
                variant="outline"
                onClick={closeCart}
                className="flex-1 rounded-none text-xs font-semibold border-outline-variant/40 hover:bg-surface-container"
              >
                <Link href="/cart">View Cart Page</Link>
              </Button>

              <Button
                asChild
                onClick={closeCart}
                className="flex-1 rounded-none text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container shadow-xs"
              >
                <Link href="/checkout" className="flex items-center justify-center gap-1.5">
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
