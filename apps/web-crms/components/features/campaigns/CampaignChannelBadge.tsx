import { Badge } from "@/components/ui/badge";
import type { CampaignChannel } from "@/types/campaign";

const CHANNEL_VARIANT: Record<CampaignChannel, React.ComponentProps<typeof Badge>["variant"]> = {
  Email: "info",
  Banner: "purple",
  Popup: "indigo",
};

export function CampaignChannelBadge({ channel }: { channel: CampaignChannel }) {
  return <Badge variant={CHANNEL_VARIANT[channel]}>{channel}</Badge>;
}
