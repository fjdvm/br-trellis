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
import type { Template } from "@/types/campaign";

export interface TemplateDeleteModalProps {
  deleteTemplateItem: Template | null;
  setDeleteTemplateItem: (tpl: Template | null) => void;
  handleDeleteConfirm: () => void;
  isDeleting: boolean;
}

export function TemplateDeleteModal({
  deleteTemplateItem,
  setDeleteTemplateItem,
  handleDeleteConfirm,
  isDeleting,
}: TemplateDeleteModalProps) {
  if (!deleteTemplateItem) return null;

  return (
    <Dialog
      open={Boolean(deleteTemplateItem)}
      onOpenChange={(open) => !open && setDeleteTemplateItem(null)}
    >
      <DialogContent className="max-w-md border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">
            Delete Template?
          </DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">"{deleteTemplateItem.name}"</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteTemplateItem(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
