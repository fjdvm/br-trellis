export type CampaignStatus = "Draft" | "Active" | "Ended";
export type CampaignType = "Regular";
export type CampaignChannel = "Email" | "Banner" | "Popup";
export type ScheduleType = "SendNow" | "Scheduled";
export type TemplateFormat = "Html" | "Blocks";

export interface CampaignChannelContent {
  channel: CampaignChannel;
  templateId?: string | null;
  subject?: string | null;
  heading?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  dismissible?: boolean;
}

export interface CampaignSchedule {
  scheduleType: ScheduleType;
  startDate?: string | null;
  endDate?: string | null;
  nextRunAt?: string | null;
}

export interface CampaignListItem {
  id: string;
  title: string;
  campaignType?: CampaignType;
  channels: CampaignChannel[];
  targetAudience?: string;
  targetCustomerIds?: string[];
  targetEmails?: string[];
  status: CampaignStatus;
  createdAt: string;
  schedule?: CampaignSchedule | null;
}

export interface Campaign extends CampaignListItem {
  channelContents: CampaignChannelContent[];
  createdById?: string | null;
  schedule?: CampaignSchedule | null;
  dispatchResult?: CampaignDispatchResult | null;
}

export interface CampaignChannelContentInput {
  channel: CampaignChannel;
  templateId?: string | null;
  subject?: string | null;
  heading?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  dismissible?: boolean;
}

export interface CreateCampaignInput {
  title: string;
  channels: CampaignChannel[];
  targetAudience?: string;
  targetEmails?: string[];
  scheduleType?: ScheduleType;
  startDate?: string;
  endDate?: string;
  channelContents?: CampaignChannelContentInput[];
}

export interface UpdateCampaignInput {
  title?: string;
  channels?: CampaignChannel[];
  targetAudience?: string;
  targetEmails?: string[];
  scheduleType?: ScheduleType;
  startDate?: string;
  endDate?: string;
  channelContents?: CampaignChannelContentInput[];
}

export interface Template {
  id: string;
  name: string;
  description?: string | null;
  content: string;
  format: TemplateFormat;
  thumbnailUrl?: string | null;
  channel: CampaignChannel;
  createdAt: string;
}

export interface CampaignDispatchResult {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  errors: string[];
  message?: string;
}


export interface CampaignEngagementMetrics {
  campaignId: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  openRate: number;
  clickRate: number;
}

export interface CampaignAnalytics {
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  openRate: number;
  clickRate: number;
  engagementByDay: { date: string; opens: number; clicks: number }[];
  linkPerformance: { destinationUrl: string; totalClicks: number; uniqueClicks: number; shareOfTotalClicks: number }[];
}
