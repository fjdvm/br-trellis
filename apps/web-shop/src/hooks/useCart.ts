"use client";

import { toast } from "sonner";
import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { cartApi } from "@/lib/api/cart-api";
import { useCartStore } from "@/lib/stores/useCartStore";
import type { CartItemDto } from "@/types/cart";

/**
 * Display details for a product, supplied by the caller (which already has the
 * product loaded from the API) so the guest cart can render real name/price/image
 * without any hardcoded catalog data in the frontend.
 */
export interface AddToCartProductInfo {
  name: string;
  price: number;
  image?: string;
  sku?: string;
  stock?: number;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";

export function useCart() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const token = (session as { accessToken?: string })?.accessToken;
  const isAuthenticated = status === "authenticated" && !!token;

  const {
    cart,
    guestItems,
    isOpen,
    loading,
    error,
    deselectedItemIds,
    setCart,
    setIsOpen,
    setLoading,
    setError,
    openCart,
    closeCart,
    toggleItemSelected,
    setAllSelected,
    updateGuestQuantity,
    removeGuestItem,
    clearGuestCart,
    optimisticAddItem,
    optimisticUpdateQuantity,
    optimisticRemoveItem,
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

  // Checkout selection derivations. An item is selected unless it appears in
  // deselectedItemIds, so newly added items default to selected.
  const isItemSelected = (itemId: string) => !deselectedItemIds.includes(itemId);
  const selectedItems = items.filter((item) => isItemSelected(item.id));
  const selectedItemIds = selectedItems.map((item) => item.id);
  const selectedTotalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const noneSelected = selectedItems.length === 0;

  const toggleSelectAll = () =>
    setAllSelected(
      items.map((item) => item.id),
      !allSelected
    );

  const addToCart = async (productId: string, quantity = 1, productInfo?: AddToCartProductInfo) => {
    // Guard against a missing product id (e.g. a not-yet-loaded product). Sending
    // an empty/invalid id makes api-oos reject the GUID bind with a 400.
    if (!productId || !productId.trim()) {
      const msg = "This product isn't ready yet. Please try again in a moment.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!isAuthenticated || !token) {
      // Adding to cart requires an authenticated shopper — the cart is
      // server-owned (api-oos /cart is [Authorize]-only). Rather than build a
      // guest cart, prompt the user to sign in and send them there, returning
      // to the current page afterwards so they can complete the add.
      toast.error("Please sign in to add items to your cart.");
      const callbackUrl = encodeURIComponent(pathname || "/");
      router.push(`/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    // Authenticated: update the UI optimistically so it feels instant, then
    // reconcile with the server in the background (rolling back on failure).
    const previousCart = cart;
    const unitPrice = productInfo?.price ?? 0;
    optimisticAddItem({
      id: `optimistic-${productId}-${Date.now()}`,
      productId,
      productName: productInfo?.name ?? "Product",
      productSKU: productInfo?.sku ?? "",
      unitPrice,
      images: [productInfo?.image || FALLBACK_IMAGE],
      quantity,
      stock: productInfo?.stock ?? 99,
      totalPrice: unitPrice * quantity,
    });
    openCart();
    setError(null);
    toast.success("Item added to cart!");

    try {
      const updatedCart = await cartApi.addItem({ productId, quantity }, token);
      setCart(updatedCart);
    } catch (err: unknown) {
      setCart(previousCart);
      const msg = err instanceof Error ? err.message : "Failed to add item to cart";
      setError(msg);
      toast.error(msg);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!isAuthenticated || !token) {
      updateGuestQuantity(itemId, quantity);
      return;
    }
    const previousCart = cart;
    optimisticUpdateQuantity(itemId, quantity);
    setError(null);
    try {
      const updatedCart = await cartApi.updateItem(itemId, { quantity }, token);
      setCart(updatedCart);
    } catch (err: unknown) {
      setCart(previousCart);
      const msg = err instanceof Error ? err.message : "Failed to update item quantity";
      setError(msg);
      toast.error(msg);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!isAuthenticated || !token) {
      removeGuestItem(itemId);
      toast.success("Item removed from cart");
      return;
    }
    const previousCart = cart;
    optimisticRemoveItem(itemId);
    setError(null);
    toast.success("Item removed from cart");
    try {
      const updatedCart = await cartApi.removeItem(itemId, token);
      setCart(updatedCart);
    } catch (err: unknown) {
      setCart(previousCart);
      const msg = err instanceof Error ? err.message : "Failed to remove item";
      setError(msg);
      toast.error(msg);
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
    // Selection for checkout
    selectedItems,
    selectedItemIds,
    selectedTotalItems,
    selectedSubtotal,
    allSelected,
    noneSelected,
    isItemSelected,
    toggleItemSelected,
    toggleSelectAll,
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
