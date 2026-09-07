"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cannedReplyCategoriesApi } from "../../inbox";

interface NewCannedCategorySheetProps {
  /** Called after a category is successfully created (e.g. to refetch). */
  onCreated?: () => void;
}

/**
 * Create a new Canned Reply Category. Name is required. Mirrors NewCompanySheet:
 * on success it closes, resets, and calls `onCreated`. Backed by POST
 * /api/v1/canned-reply-categories (gated by Conversations.canWrite on the API).
 */
export function NewCannedCategorySheet({ onCreated }: NewCannedCategorySheetProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setNameError(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await cannedReplyCategoriesApi.create({ name: trimmed });
      resetForm();
      setOpen(false);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center justify-center">
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full">
        <SheetHeader className="pb-4">
          <SheetTitle>New Category</SheetTitle>
          <SheetDescription>
            Group canned replies by topic (e.g. Shipping, Refunds). Name is required.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="category-name">Name *</Label>
            <Input
              id="category-name"
              placeholder="Shipping"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              autoFocus
              aria-invalid={!!nameError}
              className={nameError ? "border-destructive" : ""}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <SheetFooter className="mt-auto pt-4 border-t border-border">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isSubmitting ? "Creating…" : "Create Category"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
