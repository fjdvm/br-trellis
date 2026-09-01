import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartDto, CartItemDto } from "@/types/cart";

interface CartStore {
  cart: CartDto | null;
  guestItems: CartItemDto[];
  isOpen: boolean;
  loading: boolean;
  error: string | null;

  // Checkout selection. We track *deselected* item ids so that any newly added
  // cart item defaults to selected without needing to know the full item list
  // up front. An item is considered selected unless its id is in this list.
  deselectedItemIds: string[];

  setCart: (cart: CartDto | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openCart: () => void;
  closeCart: () => void;

  // Selection actions.
  toggleItemSelected: (itemId: string) => void;
  setAllSelected: (itemIds: string[], selected: boolean) => void;

  addGuestItem: (item: CartItemDto) => void;
  updateGuestQuantity: (itemId: string, quantity: number) => void;
  removeGuestItem: (itemId: string) => void;
  clearGuestCart: () => void;
  clearCartStore: () => void;

  // Optimistic mutations for the authenticated (server-backed) cart. These
  // update local state immediately so the UI feels instant; useCart reconciles
  // with the server response (or rolls back) afterwards.
  optimisticAddItem: (item: CartItemDto) => void;
  optimisticUpdateQuantity: (itemId: string, quantity: number) => void;
  optimisticRemoveItem: (itemId: string) => void;
}

function recalcCart(cart: CartDto): CartDto {
  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.items.reduce((sum, i) => sum + i.totalPrice, 0);
  return { ...cart, totalItems, subtotal };
}

function emptyCart(): CartDto {
  return { id: "", userId: "", items: [], subtotal: 0, totalItems: 0 };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      guestItems: [],
      isOpen: false,
      loading: false,
      error: null,
      deselectedItemIds: [],

      setCart: (cart) => set({ cart }),
      setIsOpen: (isOpen) => set({ isOpen }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      toggleItemSelected: (itemId) => {
        const { deselectedItemIds } = get();
        set({
          deselectedItemIds: deselectedItemIds.includes(itemId)
            ? deselectedItemIds.filter((id) => id !== itemId)
            : [...deselectedItemIds, itemId],
        });
      },

      setAllSelected: (itemIds, selected) => {
        set({ deselectedItemIds: selected ? [] : [...itemIds] });
      },

      addGuestItem: (newItem) => {
        const { guestItems } = get();
        const existingIndex = guestItems.findIndex((i) => i.productId === newItem.productId);
        if (existingIndex > -1) {
          const updated = [...guestItems];
          const item = updated[existingIndex];
          const newQty = item.quantity + newItem.quantity;
          updated[existingIndex] = {
            ...item,
            quantity: newQty,
            totalPrice: item.unitPrice * newQty,
          };
          set({ guestItems: updated });
        } else {
          set({ guestItems: [...guestItems, newItem] });
        }
      },

      updateGuestQuantity: (itemId, quantity) => {
        const { guestItems } = get();
        if (quantity <= 0) {
          set({ guestItems: guestItems.filter((i) => i.id !== itemId) });
        } else {
          set({
            guestItems: guestItems.map((i) =>
              i.id === itemId
                ? { ...i, quantity, totalPrice: i.unitPrice * quantity }
                : i
            ),
          });
        }
      },

      removeGuestItem: (itemId) => {
        const { guestItems } = get();
        set({ guestItems: guestItems.filter((i) => i.id !== itemId) });
      },

      clearGuestCart: () => set({ guestItems: [] }),
      clearCartStore: () => set({ cart: null, guestItems: [], isOpen: false, error: null, deselectedItemIds: [] }),

      optimisticAddItem: (newItem) => {
        const { cart } = get();
        const base = cart ?? emptyCart();
        const existingIndex = base.items.findIndex((i) => i.productId === newItem.productId);
        let items: CartItemDto[];
        if (existingIndex > -1) {
          items = [...base.items];
          const item = items[existingIndex];
          const newQty = item.quantity + newItem.quantity;
          items[existingIndex] = { ...item, quantity: newQty, totalPrice: item.unitPrice * newQty };
        } else {
          items = [...base.items, newItem];
        }
        set({ cart: recalcCart({ ...base, items }) });
      },

      optimisticUpdateQuantity: (itemId, quantity) => {
        const { cart } = get();
        if (!cart) return;
        const items =
          quantity <= 0
            ? cart.items.filter((i) => i.id !== itemId)
            : cart.items.map((i) =>
                i.id === itemId ? { ...i, quantity, totalPrice: i.unitPrice * quantity } : i
              );
        set({ cart: recalcCart({ ...cart, items }) });
      },

      optimisticRemoveItem: (itemId) => {
        const { cart } = get();
        if (!cart) return;
        const items = cart.items.filter((i) => i.id !== itemId);
        set({ cart: recalcCart({ ...cart, items }) });
      },
    }),
    {
      name: "ube_guest_cart",
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
);
