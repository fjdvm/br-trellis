import type { CampaignChannel } from "@/features/campaigns/types";

// The fixed pair of header-band gradient themes a Block Template (Email-only)
// can apply. Unrelated to ChannelContentState's per-Campaign "themeGradient"
// (Banner/Popup mock-preview-only) - different feature, similar name/colors,
// deliberately not merged. See channel-content-form.tsx.
export type EmailTheme = "VioletToLight" | "LightToViolet";

// A block's real content, shaped per block type and consumed by
// EmailBodyRenderer: plain text for heading/text, {text,url} for button/link,
// {url,alt} for image, or a list of {imageUrl,caption,linkUrl} slides for carousel.
export type BlockContentValue =
  | string
  | { text: string; url: string }
  | { url: string; alt: string }
  | Array<{ imageUrl: string; caption?: string; linkUrl?: string }>;

export interface TemplateBlock {
  id?: string;
  type: string;
  label: string;
  order: number;
  textAlign?: string | null;
  isBold?: boolean;
  isItalic?: boolean;
  content?: BlockContentValue | null;
}

export interface BlockTemplate {
  id: string;
  name: string;
  description?: string | null;
  channel: CampaignChannel;
  isArchived: boolean;
  theme: EmailTheme;
  createdAt: string;
  updatedAt: string;
  blocks: TemplateBlock[];
}

export interface CreateBlockTemplateInput {
  name: string;
  description?: string | null;
  channel: CampaignChannel;
  theme: EmailTheme;
  blocks: {
    type: string;
    label: string;
    order: number;
    textAlign?: string | null;
    isBold?: boolean;
    isItalic?: boolean;
    content?: BlockContentValue | null;
  }[];
}
