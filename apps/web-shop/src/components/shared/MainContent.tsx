"use client";

import type { ReactNode } from "react";
import { Footer } from "@/components/shared/Footer";
import { useCartStore } from "@/lib/stores/useCartStore";

/**
 * Wraps the page's main content and footer. When the shopping cart drawer is
 * open we blur and darken this region (matching the header's frosted-glass
 * look) so it visually recedes behind the CartSheet overlay.
 *
 * A CSS `filter` (blur) creates a new stacking context. To keep
 * click-outside-to-close working, MainContent renders its own overlay directly
 * over the blurred content that closes the cart on click. The overlay also
 * carries the dark tint.
 */
export function MainContent({ children }: { children: ReactNode }) {
  const isCartOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);

  return (
    <div className="relative flex-1 flex flex-col">
      <main
        className={`flex-1 transition-[filter] duration-300 ${
          isCartOpen ? "blur-md" : "blur-none"
        }`}
      >
        {children}
      </main>

      <div
        className={`transition-[filter] duration-300 ${
          isCartOpen ? "blur-md" : "blur-none"
        }`}
      >
        <Footer />
      </div>

      {isCartOpen && (
        <div
          className="absolute inset-0 z-50 cursor-pointer bg-inverse-surface/60 transition-opacity animate-fade-in"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
