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
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto gap-4">
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
        <div className="space-y-8">
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
