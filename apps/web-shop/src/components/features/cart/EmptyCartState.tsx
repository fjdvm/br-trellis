"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyCartStateProps {
  onClose?: () => void;
}

export function EmptyCartState({ onClose }: EmptyCartStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
      <div className="w-20 h-20 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        <ShoppingBag className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h3 className="font-serif text-2xl font-normal text-primary">Your cart is empty</h3>
        <p className="font-sans text-sm text-on-surface-variant mt-2 max-w-xs leading-relaxed">
          Looks like you haven&apos;t added any delicious Ube treats to your cart yet!
        </p>
      </div>
      <Button
        asChild
        onClick={onClose}
        className="rounded-none px-8 py-3 bg-primary text-white hover:bg-primary-container shadow-sm font-medium transition-all"
      >
        <Link href="/products">Browse Catalog</Link>
      </Button>
    </div>
  );
}
