import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CampaignCancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSaveDraft: () => Promise<void>;
  saveDisabled: boolean;
}

export function CampaignCancelModal({
  open,
  onOpenChange,
  onDiscard,
  onSaveDraft,
  saveDisabled,
}: CampaignCancelModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-gray-200 dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Save Campaign Draft?</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Would you like to save your campaign as a draft before leaving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0 sm:justify-between flex-col-reverse sm:flex-row">
          <Button variant="destructive" onClick={onDiscard}>
            Discard & Leave
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Continue Editing
            </Button>
            <Button
              onClick={async () => {
                onOpenChange(false);
                await onSaveDraft();
              }}
              disabled={saveDisabled}
            >
              Save Draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
