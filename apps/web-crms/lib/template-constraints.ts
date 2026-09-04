import type { CampaignChannel } from "@/types/campaign";

export type BlockType = "carousel" | "image" | "link" | "heading" | "text" | "button";

export interface ChannelConstraints {
  maxCarousel: number;
  maxImages: number;
  maxLinks: number;
  maxHeadings: number;
  maxTexts: number;
  maxButtons: number;
}

export const CHANNEL_CONSTRAINTS: Record<Exclude<CampaignChannel, "Banner">, ChannelConstraints> = {
  Email: {
    maxCarousel: 1,
    maxImages: 3,
    maxLinks: 3,
    maxHeadings: 3,
    maxTexts: 3,
    maxButtons: 5,
  },
  Popup: {
    maxCarousel: 0,
    maxImages: 1,
    maxLinks: 2,
    maxHeadings: 1,
    maxTexts: 1,
    maxButtons: 5,
  },
};

export function getChannelConstraints(channel: CampaignChannel): ChannelConstraints {
  return (CHANNEL_CONSTRAINTS as Record<string, ChannelConstraints>)[channel] ?? CHANNEL_CONSTRAINTS.Email;
}

export function validateBlockCount(
  channel: CampaignChannel,
  blockType: BlockType,
  currentCount: number
): { allowed: boolean; max: number; reason?: string } {
  const constraints = getChannelConstraints(channel);
  let max = 0;
  let label = "";

  switch (blockType) {
    case "carousel":
      max = constraints.maxCarousel;
      label = "carousel";
      break;
    case "image":
      max = constraints.maxImages;
      label = "image";
      break;
    case "link":
      max = constraints.maxLinks;
      label = "link";
      break;
    case "heading":
      max = constraints.maxHeadings;
      label = "heading title";
      break;
    case "text":
      max = constraints.maxTexts;
      label = "paragraph text";
      break;
    case "button":
      max = constraints.maxButtons;
      label = "button";
      break;
  }

  if (currentCount >= max) {
    return {
      allowed: false,
      max,
      reason: max === 0 
        ? `${channel} templates do not allow ${label} components.` 
        : `${channel} templates allow a maximum of ${max} ${label} component${max > 1 ? "s" : ""}.`,
    };
  }

  return { allowed: true, max };
}
