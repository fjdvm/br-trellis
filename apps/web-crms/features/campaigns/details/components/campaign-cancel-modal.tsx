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

export interface CampaignCancelModalProps {
  showCancelModal: boolean;
  setShowCancelModal: (open: boolean) => void;
  onDiscardAndLeave: () => void;
  onSaveDraft: () => Promise<void>;
  submitting: boolean;
  canProceedPlatform: boolean;
  step: string;
}

export function CampaignCancelModal({
  showCancelModal,
  setShowCancelModal,
  onDiscardAndLeave,
  onSaveDraft,
  submitting,
  canProceedPlatform,
  step,
}: CampaignCancelModalProps) {
  if (!showCancelModal) return null;

  return (
    <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
      <DialogContent className="max-w-md border border-gray-200 dark:border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Save Campaign Draft?</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Would you like to save your campaign as a draft before leaving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0 sm:justify-between flex-col-reverse sm:flex-row">
          <Button
            variant="destructive"
            onClick={onDiscardAndLeave}
          >
            Discard & Leave
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Continue Editing
            </Button>
            <Button
              onClick={async () => {
                setShowCancelModal(false);
                await onSaveDraft();
              }}
              disabled={submitting || (step === "Platform" && !canProceedPlatform)}
            >
              Save Draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
