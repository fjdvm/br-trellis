import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/types/campaign";

const STATUS_VARIANT: Record<CampaignStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  Draft: "secondary",
  Active: "success",
  Ended: "warning",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>;
}
