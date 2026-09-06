"use client";

import { useEffect, useRef, useState } from "react";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";

const DEBOUNCE_MS = 350;

// Debounced call into the real backend renderer (EmailBodyRenderer, via
// POST /api/v1/campaigns/render-preview) so the composer's live preview shows
// exactly what would actually be sent/displayed, instead of a second,
// independently maintained rendering implementation that can silently drift.
// The last successful render is kept on screen while a new one is in flight,
// so typing doesn't flicker the preview to blank/stale content.
//
// theme is passed straight through to the same endpoint (a sibling of
// content, mirroring EmailBodyRenderer's own theme parameter) so every
// consumer of this hook renders the exact same header band the real
// dispatched email would.
export function useRenderedPreviewHtml(content: string | null | undefined, theme?: string) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const trimmed = (content ?? "").trim();

  useEffect(() => {
    if (!trimmed) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      setLoading(true);
      campaignsApi
        .renderPreview(trimmed, theme)
        .then((result) => {
          if (requestIdRef.current === requestId) {
            setHtml(result.html);
          }
        })
        .catch(() => {
          // Keep the last successful render rather than blanking the preview.
        })
        .finally(() => {
          if (requestIdRef.current === requestId) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed, theme]);

  // Content cleared entirely (not just still debouncing) — nothing to show,
  // regardless of a previous render still sitting in state.
  return trimmed ? { html, loading } : { html: "", loading: false };
}
