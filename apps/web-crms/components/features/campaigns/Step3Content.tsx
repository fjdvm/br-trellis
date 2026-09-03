"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChannelContentForm,
  type ChannelContentState,
} from "@/components/features/campaigns/ChannelContentForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CampaignChannel } from "@/types/campaign";

interface Step3ContentProps {
  channels: CampaignChannel[];
  contents: Record<string, ChannelContentState>;
  onUpdateContent: (channel: CampaignChannel, patch: Partial<ChannelContentState>) => void;
  onSaveDraft?: () => Promise<void>;
}

export function Step3Content({
  channels,
  contents,
  onUpdateContent,
  onSaveDraft,
}: Step3ContentProps) {
  const [activeTab, setActiveTab] = useState<string>(channels[0] ?? "");
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [showTabDraftModal, setShowTabDraftModal] = useState(false);
  const [saving, setSaving] = useState(false);

  if (channels.length === 0) {
    return <div className="text-muted-foreground text-base p-4">No channels selected.</div>;
  }

  function handleTabClick(targetTab: string) {
    if (targetTab === activeTab) return;
    setPendingTab(targetTab);
    setShowTabDraftModal(true);
  }

  async function handleConfirmSaveDraft() {
    setSaving(true);
    if (onSaveDraft) {
      await onSaveDraft();
    }
    setSaving(false);
    setShowTabDraftModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }

  function handleSwitchWithoutSave() {
    setShowTabDraftModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Render Channel Content Forms using Tabs when 2+ channels selected */}
      {channels.length > 1 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <TabsList className="w-auto justify-start border-none rounded-none bg-transparent p-0 h-auto gap-4">
              {channels.map((ch) => (
                <TabsTrigger
                  key={ch}
                  value={ch}
                  onClick={(e) => {
                    if (ch !== activeTab) {
                      e.preventDefault();
                      handleTabClick(ch);
                    }
                  }}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold px-4 py-2 cursor-pointer"
                >
                  {ch} Content
                </TabsTrigger>
              ))}
            </TabsList>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Draft-First Policy Info"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/60"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="p-3 bg-popover border border-border text-popover-foreground shadow-md space-y-1 max-w-xs">
                  <p className="font-semibold text-xs text-foreground">Draft-First Policy</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All campaigns are initially saved as a Draft. Review, stage testing, and explicit launch occur directly from the Campaign Detail view.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {channels.map((ch) => (
            <TabsContent key={ch} value={ch} className="mt-4 focus-visible:outline-none">
              <ChannelContentForm
                channel={ch}
                value={contents[ch] ?? {}}
                onChange={(patch) => onUpdateContent(ch, patch)}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-base font-semibold text-foreground">{channels[0]} Content</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Draft-First Policy Info"
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/60"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="p-3 bg-popover border border-border text-popover-foreground shadow-md space-y-1 max-w-xs">
                  <p className="font-semibold text-xs text-foreground">Draft-First Policy</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All campaigns are initially saved as a Draft. Review, stage testing, and explicit launch occur directly from the Campaign Detail view.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ChannelContentForm
            channel={channels[0]}
            value={contents[channels[0]] ?? {}}
            onChange={(patch) => onUpdateContent(channels[0], patch)}
          />
        </div>
      )}

      {/* Save Draft Tab Switching Modal */}
      {showTabDraftModal && (
        <Dialog open={showTabDraftModal} onOpenChange={setShowTabDraftModal}>
          <DialogContent className="max-w-md border border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Save Campaign Draft?</DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Would you like to save your campaign draft before switching content tabs?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0 sm:justify-between flex-col-reverse sm:flex-row">
              <Button variant="ghost" onClick={handleSwitchWithoutSave}>
                Switch Without Saving
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTabDraftModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmSaveDraft} disabled={saving}>
                  {saving ? "Saving…" : "Save Draft"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
