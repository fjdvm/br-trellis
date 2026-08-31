import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartDto, CartItemDto } from "@/types/cart";

interface CartStore {
  cart: CartDto | null;
  guestItems: CartItemDto[];
  isOpen: boolean;
  loading: boolean;
  error: string | null;

  setCart: (cart: CartDto | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openCart: () => void;
  closeCart: () => void;

  addGuestItem: (item: CartItemDto) => void;
  updateGuestQuantity: (itemId: string, quantity: number) => void;
  removeGuestItem: (itemId: string) => void;
  clearGuestCart: () => void;
  clearCartStore: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      guestItems: [],
      isOpen: false,
      loading: false,
      error: null,

      setCart: (cart) => set({ cart }),
      setIsOpen: (isOpen) => set({ isOpen }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

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
      clearCartStore: () => set({ cart: null, guestItems: [], isOpen: false, error: null }),
    }),
    {
      name: "ube_guest_cart",
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
);
