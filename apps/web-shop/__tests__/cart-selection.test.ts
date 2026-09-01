import { useCartStore } from "@/lib/stores/useCartStore";
import type { CartItemDto } from "@/types/cart";

function makeItem(id: string): CartItemDto {
  return {
    id,
    productId: `p-${id}`,
    productName: `Product ${id}`,
    productSKU: `SKU-${id}`,
    unitPrice: 10,
    images: [],
    quantity: 1,
    stock: 99,
    totalPrice: 10,
  };
}

/** Helper: an item is selected unless its id is in deselectedItemIds. */
function isSelected(id: string): boolean {
  return !useCartStore.getState().deselectedItemIds.includes(id);
}

describe("useCartStore selection", () => {
  beforeEach(() => {
    useCartStore.getState().clearCartStore();
  });

  it("defaults new items to selected (empty deselected list)", () => {
    expect(useCartStore.getState().deselectedItemIds).toEqual([]);
    expect(isSelected("a")).toBe(true);
  });

  it("toggleItemSelected deselects then reselects an item", () => {
    const { toggleItemSelected } = useCartStore.getState();

    toggleItemSelected("a");
    expect(isSelected("a")).toBe(false);
    expect(useCartStore.getState().deselectedItemIds).toContain("a");

    toggleItemSelected("a");
    expect(isSelected("a")).toBe(true);
    expect(useCartStore.getState().deselectedItemIds).not.toContain("a");
  });

  it("setAllSelected(false) deselects all provided ids", () => {
    const ids = ["a", "b", "c"];
    useCartStore.getState().setAllSelected(ids, false);
    expect(useCartStore.getState().deselectedItemIds).toEqual(ids);
    ids.forEach((id) => expect(isSelected(id)).toBe(false));
  });

  it("setAllSelected(true) clears deselection (selects all)", () => {
    useCartStore.getState().setAllSelected(["a", "b"], false);
    useCartStore.getState().setAllSelected(["a", "b"], true);
    expect(useCartStore.getState().deselectedItemIds).toEqual([]);
    expect(isSelected("a")).toBe(true);
    expect(isSelected("b")).toBe(true);
  });

  it("clearCartStore resets selection", () => {
    useCartStore.getState().toggleItemSelected("a");
    expect(useCartStore.getState().deselectedItemIds).toContain("a");
    useCartStore.getState().clearCartStore();
    expect(useCartStore.getState().deselectedItemIds).toEqual([]);
  });

  it("only unselected items are excluded when deriving a selection", () => {
    const items = [makeItem("a"), makeItem("b"), makeItem("c")];
    useCartStore.getState().toggleItemSelected("b");

    const selected = items.filter((i) => isSelected(i.id));
    expect(selected.map((i) => i.id)).toEqual(["a", "c"]);

    const selectedSubtotal = selected.reduce((s, i) => s + i.totalPrice, 0);
    expect(selectedSubtotal).toBe(20);
  });
});
