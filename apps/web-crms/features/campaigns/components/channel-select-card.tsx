"use client";

import { Mail, PanelTop, AppWindow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { CampaignChannel } from "@/features/campaigns/types";

export interface ChannelMeta {
  channel: CampaignChannel;
  title: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  supports: string[];
  metaInfo: { label: string; value: string };
}

export const CHANNEL_META: ChannelMeta[] = [
  {
    channel: "Email",
    title: "Email Campaign",
    tag: "Primary Reach",
    description:
      "Send direct HTML newsletter or notification emails to customer inboxes with trackable engagement metrics.",
    icon: Mail,
    supports: ["Subject line", "Rich body text", "Responsive templates", "Hero banners"],
    metaInfo: { label: "Estimated Delivery", value: "< 3 mins" },
  },
  {
    channel: "Banner",
    title: "Web Banner",
    tag: "In-App Surface",
    description:
      "Display a persistent notification banner across the top header of the authenticated user portal.",
    icon: PanelTop,
    supports: ["Short announcement text", "Primary link URL", "Tone & style preset"],
    metaInfo: { label: "Portal Position", value: "Header Global" },
  },
  {
    channel: "Popup",
    title: "Modal Popup",
    tag: "High Interrupt",
    description:
      "Trigger an overlay dialog for critical system announcements, regulatory disclosures, and urgent launches.",
    icon: AppWindow,
    supports: ["Modal heading", "Body copy", "CTA button & URL", "Dismiss rules"],
    metaInfo: { label: "User Action", value: "Explicit Modal Dismiss" },
  },
];

export function ChannelSelectCard({
  meta,
  checked,
  onToggle,
}: {
  meta: ChannelMeta;
  checked: boolean;
  onToggle: () => void;
}) {
  const Icon = meta.icon;
  return (
    <label
      className={cn(
        "group relative rounded-xl p-5 cursor-pointer transition-all duration-150 border flex flex-col justify-between gap-4 h-full shadow-xs",
        checked
          ? "bg-card border-primary text-foreground ring-1 ring-primary/20"
          : "bg-card/60 border-border text-muted-foreground hover:bg-card hover:border-border/80"
      )}
    >
      <div className="space-y-3 w-full">
        {/* Card Header: Checkbox, Icon, Title, and Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Checkbox
              aria-label={meta.channel}
              checked={checked}
              onCheckedChange={onToggle}
              className="w-5 h-5 border-muted-foreground/60 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground shrink-0"
            />
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform border",
                checked
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-border/40"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <Badge
            variant={checked ? "default" : "secondary"}
            className="uppercase tracking-wider text-[10px] font-semibold shrink-0"
          >
            {meta.tag}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-title-md font-bold text-foreground tracking-tight pt-1">
          {meta.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {meta.description}
        </p>

        {/* Supported Content Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
          {meta.supports.map((s) => (
            <span
              key={s}
              className="text-[11px] bg-muted/60 border border-border/60 text-foreground px-2 py-0.5 rounded font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
        <span>{meta.metaInfo.label}</span>
        <span className="font-semibold text-foreground">{meta.metaInfo.value}</span>
      </div>
    </label>
  );
}
