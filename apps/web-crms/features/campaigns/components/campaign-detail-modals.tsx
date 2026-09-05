import React from "react";
import { Rocket, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Campaign } from "@/types/campaign";

interface CampaignDetailModalsProps {
  campaign: Campaign;
  recipientCount: number;
  showLaunchModal: boolean;
  setShowLaunchModal: (v: boolean) => void;
  showEndModal: boolean;
  setShowEndModal: (v: boolean) => void;
  onLaunch: () => void;
  onEndCampaign: () => void;
  busy: boolean;
}

export function CampaignDetailModals({
  campaign,
  recipientCount,
  showLaunchModal,
  setShowLaunchModal,
  showEndModal,
  setShowEndModal,
  onLaunch,
  onEndCampaign,
  busy,
}: CampaignDetailModalsProps) {
  return (
    <>
      {/* Launch Confirmation Modal */}
      {showLaunchModal && (
        <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
          <DialogContent className="max-w-md border border-gray-200 dark:border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Confirm Launch
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Are you sure you want to launch this campaign? This action will immediately trigger dispatches to{" "}
                <strong className="text-foreground">{recipientCount} recipients</strong> across{" "}
                {campaign.channels.length} {campaign.channels.length === 1 ? "channel" : "channels"}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowLaunchModal(false)}>
                Cancel
              </Button>
              <Button onClick={onLaunch} disabled={busy} className="shadow-sm">
                {busy ? "Launching…" : "Confirm Launch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* End Campaign Confirmation Modal */}
      {showEndModal && (
        <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
          <DialogContent className="max-w-md border border-gray-200 dark:border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                <StopCircle className="w-5 h-5 text-destructive" />
                Confirm End Campaign
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Are you sure you want to end this active campaign? Active dispatches and banners will be stopped immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowEndModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onEndCampaign} disabled={busy}>
                {busy ? "Ending…" : "Confirm End Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
