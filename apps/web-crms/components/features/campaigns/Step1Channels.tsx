"use client";

import { SlidersHorizontal } from "lucide-react";
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
      <div className="space-y-2">
        <Label htmlFor="campaign-title" className="text-base font-semibold">
          Campaign Title
        </Label>
        <Input
          id="campaign-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Q4 Product Showcase"
          className="text-lg h-12"
        />
      </div>

      {/* Select Channels Header & Counter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Distribution Channels
          </Label>
          <Badge variant="outline" className="gap-1 font-semibold text-xs py-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span id="channel-counter">
              {channels.length} {channels.length === 1 ? "Channel" : "Channels"}{" "}
              Selected
            </span>
          </Badge>
        </div>

        {/* Channel Selection Stack (Responsive Row Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}
