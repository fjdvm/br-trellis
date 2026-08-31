"use client";

import { toast } from "sonner";
import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cartApi } from "@/lib/api/cart-api";
import { useCartStore } from "@/lib/stores/useCartStore";
import type { CartItemDto } from "@/types/cart";

const CATALOG_LOOKUP: Record<string, { name: string; price: number; image: string }> = {
  "ube-cream": {
    name: "Ube Cream",
    price: 24,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJvudR-coJQnmXn0SG18CIXNB-geEbE3ML_K2e4pWAZxNR1HVPPHvwv-kWegsvycGiDm5Ho4OxW8voPvRdfa_gXF9rqPZzo8O3VIiJJ9pCOreYZEJ6xIz0eFq8ucte45mDeoNtipXfMjX-FVajoJIn5eqi9PGiynrvl5RspVeLccOTq9M0m1iWXih0sA-TlwoOm5eFTFHR2JE8AspBqp7WxWNuopCb5XK8SRldm0kA0aLU67_1PRR",
  },
  "purple-yam-jam": {
    name: "Purple Yam Jam",
    price: 18,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCK2_zvxOS8VCDQW2lb3TFCUCR7o0GIBwh8yS2xRRgXTObJM-apHisKbhmHNJf5UrKLppyh1u6CalRCqE0eT_rk342EoDPs4N6qhBICw0hiiSZUvCHxxJUA0J3UBJg8o4qYNWi2cViUfGRc-KyvqZPtS7RB_zkn6vvJLNYmkSmPMikMBYkbII502nIkMk7qThGW2LAvcdn72FE9-yNaMNvlOwcQqDWHcDbJ9SUNoQGYg2msEmBiB_K",
  },
  "artisanal-ube-cake": {
    name: "Artisanal Ube Cake",
    price: 45,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8dVsNjfWWVxdoTRjlc-DOFYwkKOOX7fDVZ8HFFecc9S1u3Ct1iPp-zrpb6mGPDwTXALlL1e3EGT8HT_3kLhfQWnYPq3xMjlckQXGxcJ16k-VNztmRSHVIq0ErC89E2ZSltVPjvm824AlgHI8mpGwZ_tSMDuYO9fXCIlLtJalqjiP3Lpa-PnYv1S_tM0Y9_eHFfQ6JwOFraKD76yzjVisMPkcDewrhj7rj_Cf0jbcemN-O_bXIxEFk",
  },
  "ube-extract": {
    name: "Ube Extract",
    price: 32,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC07hmWOl5y_trOgbx-WOMR4jE0zUBRYFZT3lOmeTa1gAvPwDNx0wMfSl907bdzH_Y7T-QaDCcHiTs-Yl1ni2shw5TAUc921nu-KeFG49S9-5VA3wFjobGFvyHN8iBcHiIt4GFVJp30_EPIf_VIcLM_gRrPhErEKfW5dNqlra55sj7aIBbw_yuQ8Wjumoy-dr30zSY53ob-duZs0Vxp4WYgkJHqSBnATNhPIRWwq6dLFaAJqdLx9omF",
  },
};

export function useCart() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const isAuthenticated = status === "authenticated" && !!token;

  const {
    cart,
    guestItems,
    isOpen,
    loading,
    error,
    setCart,
    setIsOpen,
    setLoading,
    setError,
    openCart,
    closeCart,
    addGuestItem,
    updateGuestQuantity,
    removeGuestItem,
    clearGuestCart,
  } = useCartStore();

  const fetchCart = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await cartApi.getCart(token);
      setCart(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load cart";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token, setCart, setLoading, setError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const items: CartItemDto[] = isAuthenticated ? cart?.items ?? [] : guestItems;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!isAuthenticated || !token) {
      const product = CATALOG_LOOKUP[productId] || {
        name: "Artisanal Ube Product",
        price: 24,
        image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80",
      };

      const newItem: CartItemDto = {
        id: `guest-${productId}-${Date.now()}`,
        productId,
        productName: product.name,
        productSKU: productId.toUpperCase(),
        unitPrice: product.price,
        images: [product.image],
        quantity,
        stock: 99,
        totalPrice: product.price * quantity,
      };

      addGuestItem(newItem);
      toast.success("Item added to cart!");
      openCart();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedCart = await cartApi.addItem({ productId, quantity }, token);
      setCart(updatedCart);
      toast.success("Item added to cart!");
      openCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add item to cart";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isAuthenticated || !token) {
      updateGuestQuantity(itemId, quantity);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updatedCart = await cartApi.updateItem(itemId, { quantity }, token);
      setCart(updatedCart);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update item quantity";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated || !token) {
      removeGuestItem(itemId);
      toast.success("Item removed from cart");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updatedCart = await cartApi.removeItem(itemId, token);
      setCart(updatedCart);
      toast.success("Item removed from cart");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove item";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || !token) {
      clearGuestCart();
      toast.success("Cart cleared");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await cartApi.clearCart(token);
      setCart({
        id: cart?.id || "",
        userId: cart?.userId || "",
        items: [],
        subtotal: 0,
        totalItems: 0,
      });
      toast.success("Cart cleared");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clear cart";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    cart,
    items,
    totalItems,
    subtotal,
    isOpen,
    loading,
    error,
    isAuthenticated,
    openCart,
    closeCart,
    setIsOpen,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
