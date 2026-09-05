"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TemplateBlock } from "@/features/campaigns/components/template-builder-components";

export interface BlockDeleteDialogProps {
  pendingBlock: TemplateBlock | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BlockDeleteDialog({ pendingBlock, onCancel, onConfirm }: BlockDeleteDialogProps) {
  if (!pendingBlock) return null;

  return (
    <Dialog open={Boolean(pendingBlock)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">Remove Block?</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Are you sure you want to remove{" "}
            <strong className="text-foreground">&quot;{pendingBlock.label || pendingBlock.type}&quot;</strong>{" "}
            from this template? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Remove Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
