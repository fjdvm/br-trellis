"use client";

import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CannedReplyListItem } from "@/features/campaigns/types";

interface CannedReplyPickerProps {
  /** Disabled wherever typing a reply is (e.g. a terminal ticket). */
  disabled: boolean;
  /**
   * Called with the selected reply's raw body (variables not yet substituted).
   * The composer performs substitution + cursor-position insertion.
   */
  onSelect: (rawBody: string) => void;
}

/**
 * Icon-triggered picker beside the Send button. Loads active (non-archived)
 * Canned Replies, groups them by Category, and offers a search box. Selecting
 * one hands its raw body to `onSelect` (the composer substitutes variables and
 * inserts at the cursor). Archived replies/categories never appear because the
 * list request omits `includeArchived`.
 */
export function CannedReplyPicker({ disabled, onSelect }: CannedReplyPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [replies, setReplies] = useState<CannedReplyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setQuery("");
      setIsLoading(true);
      setError(null);
      try {
        // Lazy import keeps the composer bundle lean and lets tests mock it.
        const { crmClient } = await import("@/lib/api/crm-client");
        const result = await crmClient.cannedReplies.list(false);
        setReplies(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load canned replies.");
      } finally {
        setIsLoading(false);
      }
    }
  }

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? replies.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.body.toLowerCase().includes(q) ||
            r.categoryName.toLowerCase().includes(q)
        )
      : replies;
    const byCategory = new Map<string, CannedReplyListItem[]>();
    for (const reply of filtered) {
      const list = byCategory.get(reply.categoryName) ?? [];
      list.push(reply);
      byCategory.set(reply.categoryName, list);
    }
    return [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [replies, query]);

  function handlePick(rawBody: string) {
    onSelect(rawBody);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          aria-label="Insert canned reply"
          className="h-11 w-11 shrink-0 rounded-full"
        >
          <Sparkles className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" aria-label="Canned replies">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              aria-label="Search canned replies"
              placeholder="Search canned replies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-9 text-base"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="p-3 text-sm text-destructive">{error}</p>
          ) : grouped.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No canned replies found.</p>
          ) : (
            grouped.map(([categoryName, items]) => (
              <div key={categoryName} className="mb-1">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryName}
                </p>
                {items.map((reply) => (
                  <button
                    key={reply.id}
                    type="button"
                    onClick={() => handlePick(reply.body)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-base hover:bg-muted focus:bg-muted focus:outline-none"
                  >
                    <span className="block font-medium">{reply.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {reply.body}
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
