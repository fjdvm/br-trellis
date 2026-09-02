"use client";

import { Info } from "lucide-react";
import {
  ChannelContentForm,
  type ChannelContentState,
} from "@/components/features/campaigns/ChannelContentForm";
import type { CampaignChannel } from "@/types/campaign";

interface Step3ContentProps {
  channels: CampaignChannel[];
  contents: Record<string, ChannelContentState>;
  onUpdateContent: (channel: CampaignChannel, patch: Partial<ChannelContentState>) => void;
}

export function Step3Content({
  channels,
  contents,
  onUpdateContent,
}: Step3ContentProps) {
  return (
    <div className="space-y-6">
      {/* Draft-First Policy Notification Banner */}
      <div className="bg-muted/40 border border-border text-foreground p-md rounded-xl shadow-xs flex items-start gap-md">
        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border text-primary">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-foreground">Draft-First Policy</span>
          <p className="text-sm text-muted-foreground mt-0.5">
            All campaigns are initially saved as a Draft. Review, stage testing, and explicit launch occur directly from the Campaign Detail view.
          </p>
        </div>
      </div>

      {/* Render Channel Content Forms for all selected channels */}
      <div className="space-y-8">
        {channels.map((ch) => (
          <ChannelContentForm
            key={ch}
            channel={ch}
            value={contents[ch] ?? {}}
            onChange={(patch) => onUpdateContent(ch, patch)}
          />
        ))}
      </div>
    </div>
  );
}
