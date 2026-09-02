"use client";

import { SlidersHorizontal, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CHANNEL_META,
  ChannelSelectCard,
} from "@/components/features/campaigns/ChannelSelectCard";
import type { CampaignChannel } from "@/types/campaign";

interface Step1ChannelsProps {
  title: string;
  onTitleChange: (title: string) => void;
  channels: CampaignChannel[];
  onToggleChannel: (channel: CampaignChannel) => void;
}

export function Step1Channels({
  title,
  onTitleChange,
  channels,
  onToggleChannel,
}: Step1ChannelsProps) {
  return (
    <div className="space-y-6">
      {/* Campaign Title Field */}
      <div className="space-y-2 max-w-xl">
        <Label htmlFor="campaign-title" className="text-sm font-semibold">
          Campaign Title
        </Label>
        <Input
          id="campaign-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Q4 Product Showcase"
          className="text-base"
        />
      </div>

      {/* Select Channels Header & Counter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Distribution Channels</Label>
          <Badge variant="outline" className="gap-1 font-semibold text-xs py-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span id="channel-counter">
              {channels.length} {channels.length === 1 ? "Channel" : "Channels"} Selected
            </span>
          </Badge>
        </div>

        {/* Channel Selection Stack */}
        <div className="flex flex-col gap-4">
          {CHANNEL_META.map((meta) => (
            <ChannelSelectCard
              key={meta.channel}
              meta={meta}
              checked={channels.includes(meta.channel)}
              onToggle={() => onToggleChannel(meta.channel)}
            />
          ))}
        </div>
      </div>

      {/* Configuration Assist Banner */}
      <div className="px-4 py-3 bg-muted/40 border border-border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-muted-foreground text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <p>
            Each selected channel generates a dedicated creative composition tab in{" "}
            <strong className="text-foreground">Step 3: Content</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono tracking-tight text-[11px]">
          <span>SYNC_READY: {channels.length}/3</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>LATENCY: ZERO_DELAY</span>
        </div>
      </div>
    </div>
  );
}
