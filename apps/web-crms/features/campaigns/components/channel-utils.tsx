import React from "react";
import type { CampaignChannel } from "@/features/campaigns/types";

export const CHANNEL_ICON: Record<CampaignChannel, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Banner: PanelTop,
  Popup: AppWindow,
};

import { Mail, PanelTop, AppWindow } from "lucide-react";

export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;
  if (/\<[a-z][\s\S]*\>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
