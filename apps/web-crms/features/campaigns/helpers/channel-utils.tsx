import React from "react";
import type { CampaignChannel } from "@/features/campaigns/types";
import { Mail, PanelTop, AppWindow } from "lucide-react";

export const CHANNEL_ICON: Record<CampaignChannel, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Banner: PanelTop,
  Popup: AppWindow,
};
