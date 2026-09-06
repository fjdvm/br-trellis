import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/features/campaigns/types";

const STATUS_VARIANT: Record<CampaignStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  Draft: "secondary",
  Active: "success",
  Ended: "warning",
};

// Dot colour per status — the wireframe pairs each status pill with a small
// leading status dot (pulsing while Active).
const STATUS_DOT: Record<CampaignStatus, string> = {
  Draft: "bg-slate-400",
  Active: "bg-emerald-500 animate-pulse",
  Ended: "bg-amber-500",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="gap-1.5">
      <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </Badge>
  );
}
