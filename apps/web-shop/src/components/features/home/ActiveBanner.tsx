"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ActiveContent } from "@/types/marketing";

/**
 * A persistent, full-width promotional strip pinned above the homepage content.
 * Optionally dismissible.
 */
export function ActiveBanner({ content }: { content: ActiveContent }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full bg-primary text-primary-foreground text-center py-2 px-4 flex items-center justify-center gap-3 text-sm">
      <span>{content.body}</span>
      {content.linkUrl && (
        <a href={content.linkUrl} className="underline font-medium">
          Learn more
        </a>
      )}
      {content.dismissible && (
        <button
          type="button"
          aria-label="Dismiss banner"
          onClick={() => setDismissed(true)}
          className="ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
