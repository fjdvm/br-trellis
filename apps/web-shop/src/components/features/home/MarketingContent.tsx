"use client";

import { useActiveContent } from "@/hooks/useActiveContent";
import { ActiveBanner } from "./ActiveBanner";
import { ActivePopup } from "./ActivePopup";

/**
 * Renders the currently-Active storefront Banner (persistent strip) and Popup
 * (dismissible modal) when present. Renders nothing when neither is active (#163).
 */
export function MarketingContent() {
  const { banner, popup } = useActiveContent();

  return (
    <>
      {banner && <ActiveBanner content={banner} />}
      {popup && <ActivePopup content={popup} />}
    </>
  );
}
