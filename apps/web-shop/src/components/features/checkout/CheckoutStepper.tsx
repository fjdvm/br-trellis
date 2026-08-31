"use client";

import { Check, CreditCard, MapPin, ShoppingBag } from "lucide-react";

interface CheckoutStepperProps {
  currentStep: number;
}

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  const steps = [
    { number: 1, label: "Shipping Address", icon: MapPin },
    { number: 2, label: "Order Review", icon: ShoppingBag },
    { number: 3, label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Step Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant/30 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const Icon = step.icon;

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-on-primary shadow-xs"
                    : isCurrent
                    ? "bg-primary text-on-primary ring-4 ring-primary/20 shadow-md"
                    : "bg-surface border border-outline-variant text-on-surface-variant"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 text-on-primary" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`mt-2 font-sans text-xs font-semibold text-center transition-colors ${
                  isCurrent || isCompleted ? "text-primary font-bold" : "text-on-surface-variant"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
