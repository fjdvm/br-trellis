"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crmClient } from "@/lib/api/crm-client";
import type {
  CannedReplyListItem,
  CannedReplyCategoryListItem,
} from "@/features/campaigns/types";

interface CannedReplySheetProps {
  /** Active categories to choose from. */
  categories: CannedReplyCategoryListItem[];
  /** When present, the sheet edits this reply; otherwise it creates a new one. */
  reply?: CannedReplyListItem;
  /** Called after a successful create/update. */
  onSaved?: () => void;
}

/**
 * Create or edit a Canned Reply (name, body, category). The body may contain
 * the literal variable placeholders {{customer_name}}, {{ticket_id}} and
 * {{agent_name}}, resolved later at insertion time in the composer. Mirrors
 * NewCompanySheet's create flow; when `reply` is provided it prefills and PUTs.
 */
export function CannedReplySheet({ categories, reply, onSaved }: CannedReplySheetProps) {
  const isEdit = !!reply;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function prefill() {
    setName(reply?.name ?? "");
    setBody(reply?.body ?? "");
    setCategoryId(reply?.categoryId ?? categories[0]?.id ?? "");
    setFieldError(null);
    setError(null);
  }

  // Keep the default category in sync once categories load (create mode).
  useEffect(() => {
    if (!open) return;
    if (!categoryId && categories.length > 0) {
      setCategoryId(reply?.categoryId ?? categories[0].id);
    }
  }, [open, categories, categoryId, reply?.categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedBody = body.trim();
    if (!trimmedName) {
      setFieldError("Name is required.");
      return;
    }
    if (!trimmedBody) {
      setFieldError("Body is required.");
      return;
    }
    if (!categoryId) {
      setFieldError("Category is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (isEdit && reply) {
        await crmClient.cannedReplies.update(reply.id, {
          name: trimmedName,
          body: trimmedBody,
          categoryId,
        });
      } else {
        await crmClient.cannedReplies.create({
          name: trimmedName,
          body: trimmedBody,
          categoryId,
        });
      }
      setOpen(false);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save canned reply.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) prefill();
      }}
    >
      <SheetTrigger asChild>
        {isEdit ? (
          <Button size="sm" variant="outline">
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
        ) : (
          <Button size="sm" className="flex items-center justify-center">
            <Plus className="w-4 h-4" />
            <span>New Canned Reply</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle>{isEdit ? "Edit Canned Reply" : "New Canned Reply"}</SheetTitle>
          <SheetDescription>
            Reusable reply text. Use {"{{customer_name}}"}, {"{{ticket_id}}"} and{" "}
            {"{{agent_name}}"} — they&apos;re filled in when the reply is inserted.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="reply-name">Name *</Label>
            <Input
              id="reply-name"
              placeholder="Order status"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-category">Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="reply-category" aria-label="Category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply-body">Body *</Label>
            <Textarea
              id="reply-body"
              placeholder="Hi {{customer_name}}, thanks for reaching out…"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              rows={8}
              className="resize-y text-base"
            />
          </div>

          {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Canned Reply"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
