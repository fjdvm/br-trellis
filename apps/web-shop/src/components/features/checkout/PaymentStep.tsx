"use client";

import { useState } from "react";
import { ArrowLeft, Banknote, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/types/order";

interface PaymentStepProps {
  totalAmount: number;
  loading: boolean;
  onBack: () => void;
  onPlaceOrder: (method: PaymentMethod) => void;
}

export function PaymentStep({ totalAmount, loading, onBack, onPlaceOrder }: PaymentStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CashOnDelivery");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceOrder(selectedMethod);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="font-serif text-xl font-bold text-primary flex items-center gap-2 border-b border-outline-variant/20 pb-3">
        <CreditCard className="w-5 h-5 text-primary" />
        Payment Method
      </h2>

      {/* Payment Selection Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
        <div
          onClick={() => setSelectedMethod("CashOnDelivery")}
          className={`p-5 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
            selectedMethod === "CashOnDelivery"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
              : "border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-on-surface">Cash on Delivery</h4>
            <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">
              Pay in cash directly to the courier upon receiving your package.
            </p>
          </div>
        </div>

        <div
          onClick={() => setSelectedMethod("CreditCard")}
          className={`p-5 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
            selectedMethod === "CreditCard"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
              : "border-outline-variant/30 bg-surface-container-lowest hover:border-primary/40"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-on-surface">Card / Online Payment</h4>
            <p className="font-sans text-xs text-on-surface-variant mt-1 leading-relaxed">
              Mock payment gateway. Credit/Debit Card or GCash sandbox.
            </p>
          </div>
        </div>
      </div>

      {/* Credit Card Mock Form (if Card selected) */}
      {selectedMethod === "CreditCard" && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 space-y-4 font-sans animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Test Card Details (Sandbox)
            </span>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
              Demo Mode
            </span>
          </div>

          <div>
            <Label htmlFor="cardNum" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">Card Number</Label>
            <Input
              id="cardNum"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="mt-1.5 rounded-lg px-5 py-3 bg-surface-container-low border-outline-variant/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExp" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">Expiry Date</Label>
              <Input
                id="cardExp"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="mt-1.5 rounded-lg px-5 py-3 bg-surface-container-low border-outline-variant/40"
              />
            </div>
            <div>
              <Label htmlFor="cardCvc" className="font-sans text-xs font-bold text-on-surface-variant uppercase tracking-wider">CVC / CVV</Label>
              <Input
                id="cardCvc"
                type="password"
                maxLength={4}
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="mt-1.5 rounded-lg px-5 py-3 bg-surface-container-low border-outline-variant/40"
              />
            </div>
          </div>
        </div>
      )}

      {/* Security & Total Summary */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex items-center justify-between font-sans">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <div>
            <span className="text-xs font-bold text-on-surface block">Secure Checkout</span>
            <span className="text-[11px] text-on-surface-variant">Encrypted connection & buyer protection</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-on-surface-variant block">Total Due</span>
          <span className="text-base font-bold text-primary">₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="rounded-xl px-6 py-2.5 text-xs font-semibold gap-2 border-outline-variant/40 hover:bg-surface-container"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Review
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="rounded-xl px-8 py-2.5 bg-primary text-on-primary font-semibold hover:bg-primary-container shadow-md"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing Order...
            </>
          ) : (
            `Place Order (₱${totalAmount.toFixed(2)})`
          )}
        </Button>
      </div>
    </form>
  );
}
