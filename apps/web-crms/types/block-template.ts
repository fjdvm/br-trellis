import type { CampaignChannel } from "@/types/campaign";

export interface TemplateBlock {
  id?: string;
  type: string;
  label: string;
  order: number;
  textAlign?: string | null;
  isBold?: boolean;
  isItalic?: boolean;
}

export interface BlockTemplate {
  id: string;
  name: string;
  description?: string | null;
  channel: CampaignChannel;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  blocks: TemplateBlock[];
}

export interface CreateBlockTemplateInput {
  name: string;
  description?: string | null;
  channel: CampaignChannel;
  blocks: {
    type: string;
    label: string;
    order: number;
    textAlign?: string | null;
    isBold?: boolean;
    isItalic?: boolean;
  }[];
}
