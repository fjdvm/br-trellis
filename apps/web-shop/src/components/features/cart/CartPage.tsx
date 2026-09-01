"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/hooks/useCart";
import { CartItemRow } from "./CartItemRow";
import { EmptyCartState } from "./EmptyCartState";

export function CartPage() {
  const {
    items,
    totalItems,
    loading,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    selectedSubtotal,
    selectedTotalItems,
    allSelected,
    noneSelected,
    isItemSelected,
    toggleItemSelected,
    toggleSelectAll,
  } = useCart();

  return (
    <div className="min-h-screen bg-surface py-[120px] px-5 md:px-[64px]">
      <main className="max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-primary text-3xl md:text-5xl font-normal">Your Cart</h1>
            <p className="body-md text-on-surface-variant mt-2">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart.
            </p>
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-error hover:bg-error-container/20 text-xs font-semibold gap-1.5 px-4 self-start md:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </Button>
          )}
        </div>

        {error && (
          <div className="p-4 mb-6 bg-error-container/30 text-on-error-container text-sm font-medium border border-error-container">
            {error}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant/30 p-12">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="body-md text-on-surface-variant mt-3">Loading your cart...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant/30 p-12">
            <EmptyCartState />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Select-all control */}
              <div className="flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant/30">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all items for checkout"
                />
                <span className="font-sans text-sm font-semibold text-on-surface">
                  {allSelected ? "Deselect all" : "Select all"}
                </span>
                <span className="font-sans text-sm text-on-surface-variant ml-auto">
                  {selectedTotalItems} of {totalItems} selected
                </span>
              </div>

              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  selected={isItemSelected(item.id)}
                  onToggleSelected={toggleItemSelected}
                />
              ))}

              <div className="pt-4 flex justify-between items-center">
                <Button asChild variant="ghost" className="text-sm font-semibold gap-2 rounded-none text-primary hover:bg-primary-container/20">
                  <Link href="/products">
                    <ArrowLeft className="w-4 h-4" />
                    Continue Shopping
                  </Link>
                </Button>
              </div>
            </div>

            {/* Order Summary Side Panel */}
            <div className="lg:col-span-4">
              <div className="bg-primary-fixed/20 p-8 sticky top-[120px] space-y-6 border border-outline-variant/20">
                <h2 className="font-serif font-bold text-2xl text-primary border-b border-primary/20 pb-4">
                  Order Summary
                </h2>

                <div className="space-y-4 font-sans text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal ({selectedTotalItems} {selectedTotalItems === 1 ? "item" : "items"})</span>
                    <span className="font-bold text-on-surface">${selectedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping</span>
                    <span className="text-on-surface">Calculated at checkout</span>
                  </div>

                  <div className="pt-4 border-t border-primary/20 flex justify-between items-center">
                    <span className="font-serif font-bold text-xl text-primary">Total</span>
                    <span className="font-serif font-bold text-2xl text-primary">
                      ${selectedSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {noneSelected ? (
                  <Button
                    disabled
                    className="w-full rounded-none py-4 font-sans text-sm font-semibold bg-primary text-white opacity-60 cursor-not-allowed"
                  >
                    Select items to checkout
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="w-full rounded-none py-4 font-sans text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-md transition-transform hover:scale-[1.02] duration-300"
                  >
                    <Link href="/checkout" className="flex items-center justify-center gap-2">
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}

                <p className="label-upper text-on-surface-variant text-center mt-4 opacity-70">
                  🔒 Secure Checkout
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
