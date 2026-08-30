import { renderHook } from "@testing-library/react";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";

describe("useRefetchOnFocus", () => {
  it("calls refetch when the window regains focus", () => {
    const refetch = jest.fn();
    renderHook(() => useRefetchOnFocus(refetch));

    expect(refetch).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("focus"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("calls refetch when the document becomes visible", () => {
    const refetch = jest.fn();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    renderHook(() => useRefetchOnFocus(refetch));

    document.dispatchEvent(new Event("visibilitychange"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT refetch when the document becomes hidden", () => {
    const refetch = jest.fn();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    renderHook(() => useRefetchOnFocus(refetch));

    document.dispatchEvent(new Event("visibilitychange"));
    expect(refetch).not.toHaveBeenCalled();
  });

  it("removes its listeners on unmount", () => {
    const refetch = jest.fn();
    const { unmount } = renderHook(() => useRefetchOnFocus(refetch));

    unmount();
    window.dispatchEvent(new Event("focus"));
    expect(refetch).not.toHaveBeenCalled();
  });
});
