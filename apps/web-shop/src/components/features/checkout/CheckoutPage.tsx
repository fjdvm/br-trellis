"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import type { PaymentMethod, ShippingAddressRequest } from "@/types/order";

import { CheckoutStepper } from "./CheckoutStepper";
import { ShippingStep } from "./ShippingStep";
import { OrderReviewStep } from "./OrderReviewStep";
import { PaymentStep } from "./PaymentStep";

export function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalItems, isAuthenticated, clearCart } = useCart();
  const { createOrder, loading: orderLoading, error: orderError } = useOrders();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressRequest | null>(null);

  const shippingFee = items.length > 0 ? 100 : 0;
  const totalAmount = subtotal + shippingFee;

  if (!isAuthenticated) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-primary">
          Please sign in to complete checkout
        </h1>
        <p className="font-sans text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
          You must be logged in to your account to specify shipping addresses and place orders.
        </p>
        <Button asChild className="rounded-xl bg-primary text-on-primary px-8 py-3 hover:bg-primary-container shadow-sm font-medium">
          <Link href="/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (items.length === 0 && currentStep === 1) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-normal text-primary">Your cart is empty</h1>
        <p className="font-sans text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
          Add some delicious Baguio Ube Halaya to your cart before proceeding to checkout!
        </p>
        <Button asChild className="rounded-xl bg-primary text-on-primary px-8 py-3 hover:bg-primary-container shadow-sm font-medium">
          <Link href="/products">Browse Catalog</Link>
        </Button>
      </div>
    );
  }

  const handleShippingSubmit = (address: ShippingAddressRequest) => {
    setShippingAddress(address);
    setCurrentStep(2);
  };

  const handlePlaceOrder = async (paymentMethod: PaymentMethod) => {
    if (!shippingAddress) return;
    try {
      const createdOrder = await createOrder({
        shippingAddress,
        paymentMethod,
      });
      await clearCart();
      router.push(`/orders/confirmation?id=${createdOrder.id}`);
    } catch {
      // Error handled by useOrders state
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-sans text-xs tracking-wider text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
        <span>/</span>
        <span className="text-on-surface font-semibold">Checkout</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal">Checkout</h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-2">
          Complete your artisanal journey with fresh Baguio Ube treats.
        </p>
      </div>

      <CheckoutStepper currentStep={currentStep} />

      {orderError && (
        <div className="p-4 mb-6 max-w-3xl mx-auto bg-error-container/30 text-on-error-container text-sm rounded-lg font-medium border border-error-container">
          {orderError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
        {/* Step Form Container */}
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl border border-outline-variant/30 p-6 sm:p-8 shadow-xs">
          {currentStep === 1 && (
            <ShippingStep
              initialAddress={shippingAddress}
              onNext={handleShippingSubmit}
            />
          )}

          {currentStep === 2 && shippingAddress && (
            <OrderReviewStep
              items={items}
              shippingAddress={shippingAddress}
              subtotal={subtotal}
              shippingFee={shippingFee}
              totalAmount={totalAmount}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <PaymentStep
              totalAmount={totalAmount}
              loading={orderLoading}
              onBack={() => setCurrentStep(2)}
              onPlaceOrder={handlePlaceOrder}
            />
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4">
          <div className="bg-primary-fixed/20 rounded-xl border border-outline-variant/20 p-6 shadow-xs sticky top-24 space-y-4">
            <h3 className="font-serif font-bold text-base text-primary border-b border-outline-variant/20 pb-3">
              Summary ({totalItems} {totalItems === 1 ? "item" : "items"})
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-bold text-on-surface">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Shipping</span>
                <span className="font-bold text-on-surface">₱{shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Tax</span>
                <span className="font-bold text-on-surface">₱0.00</span>
              </div>
              <div className="pt-3 border-t border-primary/20 flex justify-between items-center text-sm font-bold">
                <span className="font-serif text-primary">Total Due</span>
                <span className="text-primary text-base">₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
