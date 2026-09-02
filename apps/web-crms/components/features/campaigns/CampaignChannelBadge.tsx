import { Mail, PanelTop, AppWindow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CampaignChannel } from "@/types/campaign";

const CHANNEL_VARIANT: Record<CampaignChannel, React.ComponentProps<typeof Badge>["variant"]> = {
  Email: "info",
  Banner: "purple",
  Popup: "indigo",
};

const CHANNEL_ICON: Record<CampaignChannel, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Banner: PanelTop,
  Popup: AppWindow,
};

export function CampaignChannelBadge({ channel }: { channel: CampaignChannel }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <Badge variant={CHANNEL_VARIANT[channel]} className="gap-1">
      <Icon className="w-3 h-3" />
      {channel}
    </Badge>
  );
}
