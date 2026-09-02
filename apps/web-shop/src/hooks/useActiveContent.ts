"use client";

import { useEffect, useState } from "react";
import { marketingApi } from "@/lib/api/marketing-api";
import type { ActiveContent } from "@/types/marketing";

/**
 * Fetches the currently-Active Banner and Popup content from api-oos (which
 * proxies api-crms). Returns null for a channel when nothing is active. Failures
 * degrade quietly — a missing promotion should never break the storefront.
 */
export function useActiveContent() {
  const [banner, setBanner] = useState<ActiveContent | null>(null);
  const [popup, setPopup] = useState<ActiveContent | null>(null);

  useEffect(() => {
    let mounted = true;
    marketingApi
      .getActiveBanner()
      .then((c) => mounted && setBanner(c))
      .catch(() => mounted && setBanner(null));
    marketingApi
      .getActivePopup()
      .then((c) => mounted && setPopup(c))
      .catch(() => mounted && setPopup(null));
    return () => {
      mounted = false;
    };
  }, []);

  return { banner, popup };
}
