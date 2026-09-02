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
}

/** The Channels selectable in the wizard, with their rich descriptions. */
export const CHANNEL_META: ChannelMeta[] = [
  {
    channel: "Email",
    title: "Email Campaign",
    tag: "Primary Reach",
    description:
      "Send direct HTML newsletters or notification emails to customer inboxes with trackable engagement metrics.",
    icon: Mail,
    supports: ["Subject line", "Rich body text", "Hero banner"],
  },
  {
    channel: "Banner",
    title: "Web Banner",
    tag: "In-App Surface",
    description:
      "Display a persistent notification banner across the top of the storefront for all visitors.",
    icon: PanelTop,
    supports: ["Announcement text", "Primary link URL", "Dismissible"],
  },
  {
    channel: "Popup",
    title: "Modal Popup",
    tag: "High Interrupt",
    description:
      "Trigger an overlay dialog for launches, promotions, and urgent announcements.",
    icon: AppWindow,
    supports: ["Heading", "Body copy", "CTA button & URL"],
  },
];

// Rich channel selection card (checkbox + icon + title + description +
// supported-content chips). Keeps a real <Checkbox aria-label={channel}> so the
// wizard tests can target `getByRole("checkbox", { name: channel })`.
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
        "flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-colors",
        checked ? "border-primary bg-muted/50" : "border-border hover:bg-muted/30"
      )}
    >
      <Checkbox
        aria-label={meta.channel}
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-title-lg font-semibold text-foreground">{meta.title}</h3>
          <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
            {meta.tag}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-sm text-muted-foreground">Supports:</span>
          {meta.supports.map((s) => (
            <span
              key={s}
              className="text-sm rounded border border-border bg-card px-2 py-0.5 text-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </label>
  );
}
