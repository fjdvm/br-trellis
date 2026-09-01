import { renderHook, act } from "@testing-library/react";
import { useCart } from "@/hooks/useCart";
import { useCartStore } from "@/lib/stores/useCartStore";

// --- Mocks ---------------------------------------------------------------

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/products/abc",
}));

// Session is unauthenticated by default; individual tests override.
let mockSession: { data: unknown; status: string } = {
  data: null,
  status: "unauthenticated",
};
jest.mock("next-auth/react", () => ({
  useSession: () => mockSession,
}));

const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// The API client must never be hit on the unauthenticated path.
const mockAddItem = jest.fn();
jest.mock("@/lib/api/cart-api", () => ({
  cartApi: {
    getCart: jest.fn(),
    addItem: (...args: unknown[]) => mockAddItem(...args),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  },
}));

describe("useCart add-to-cart auth guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartStore.getState().clearCartStore();
    mockSession = { data: null, status: "unauthenticated" };
  });

  it("blocks an unauthenticated add: no item stored, no API call", async () => {
    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart("prod-1", 1, { name: "Ube Jam", price: 100 });
    });

    // Nothing added to any cart, and the server was never called.
    expect(useCartStore.getState().guestItems).toHaveLength(0);
    expect(result.current.items).toHaveLength(0);
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it("prompts to sign in and redirects to /signin with a callbackUrl", async () => {
    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart("prod-1", 1, { name: "Ube Jam", price: 100 });
    });

    expect(mockToastError).toHaveBeenCalledWith(
      "Please sign in to add items to your cart."
    );
    expect(mockPush).toHaveBeenCalledWith(
      "/signin?callbackUrl=" + encodeURIComponent("/products/abc")
    );
  });

  it("does not add to guest cart when status is loading", async () => {
    mockSession = { data: null, status: "loading" };
    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart("prod-1", 1, { name: "Ube Jam", price: 100 });
    });

    expect(useCartStore.getState().guestItems).toHaveLength(0);
    expect(mockPush).toHaveBeenCalled();
  });
});
