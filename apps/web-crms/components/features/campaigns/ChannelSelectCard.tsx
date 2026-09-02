"use client";

import { Mail, PanelTop, AppWindow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { CampaignChannel } from "@/types/campaign";

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
        "group relative rounded-lg p-5 cursor-pointer transition-all duration-150 border flex items-start gap-4",
        checked
          ? "bg-card border-primary text-foreground shadow-xs"
          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
      )}
    >
      <div className="pt-1 flex-shrink-0">
        <Checkbox
          aria-label={meta.channel}
          checked={checked}
          onCheckedChange={onToggle}
          className="w-5 h-5 border-muted-foreground/60 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      </div>

      {/* Icon Frame */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform border",
          checked
            ? "bg-background text-foreground border-border"
            : "bg-background/80 text-muted-foreground border-border/40"
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-title-lg font-semibold text-foreground">{meta.title}</h3>
          <Badge
            variant={checked ? "default" : "secondary"}
            className="uppercase tracking-wider text-[10px] font-semibold"
          >
            {meta.tag}
          </Badge>
        </div>
        <p className="text-body-md text-muted-foreground mt-1">{meta.description}</p>

        {/* Supported Content Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">Supported Content:</span>
          {meta.supports.map((s) => (
            <span
              key={s}
              className="text-xs bg-background border border-border text-foreground px-2.5 py-0.5 rounded shadow-xs"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Metric / Capability Metadata (Desktop) */}
      <div className="hidden lg:flex flex-col items-end justify-center pl-4 text-right flex-shrink-0">
        <span className="text-xs text-muted-foreground">{meta.metaInfo.label}</span>
        <span className="text-sm font-bold text-foreground">{meta.metaInfo.value}</span>
      </div>
    </label>
  );
}
