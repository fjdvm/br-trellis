"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ActiveContent } from "@/types/marketing";

/**
 * A centered, dismissible modal overlay shown over the homepage when a Popup
 * campaign is active.
 */
export function ActivePopup({ content }: { content: ActiveContent }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-surface rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <button
          type="button"
          aria-label="Close popup"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        {content.imageUrl && (
          <img src={content.imageUrl} alt="" className="w-full rounded-md mb-4" />
        )}
        {content.heading && <h2 className="text-xl font-bold mb-2">{content.heading}</h2>}
        {content.body && <p className="text-muted-foreground mb-4">{content.body}</p>}
        {content.ctaText && content.ctaUrl && (
          <a
            href={content.ctaUrl}
            className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-md font-medium"
          >
            {content.ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
