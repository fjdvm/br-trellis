export interface ActiveContent {
  campaignId: string;
  channel: "Banner" | "Popup";
  heading?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  dismissible: boolean;
}
