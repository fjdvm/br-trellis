"use client";

import { useEffect } from "react";

/**
 * Re-run a fetch callback whenever the tab regains focus or becomes visible
 * again.
 *
 * The Tickets/My Assigned lists and the Conversations Inbox deliberately load
 * once on mount with no background poll. That leaves them stale after a
 * mutation performed on a *different* screen (e.g. claiming a ticket on the
 * ticket detail page, then switching back to My Assigned or the Inbox): the
 * ownership/visibility filters are correct, but the cached list still holds the
 * pre-claim row, so the just-claimed ticket never shows up until a manual
 * refresh.
 *
 * Refetching on focus/visibility closes that gap without introducing a poll:
 * returning to a list re-syncs it with the server exactly when the user looks
 * at it again. `refetch` should be a stable (useCallback-wrapped) reference so
 * the listener isn't torn down and re-added on every render.
 */
export function useRefetchOnFocus(refetch: () => void): void {
  useEffect(() => {
    function onFocus() {
      refetch();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        refetch();
      }
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetch]);
}
