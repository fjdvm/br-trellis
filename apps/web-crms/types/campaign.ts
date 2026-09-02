export type CampaignStatus = "Draft" | "Active" | "Ended";
export type CampaignType = "Regular";
export type CampaignChannel = "Email" | "Banner" | "Popup";
export type ScheduleType = "SendNow" | "Scheduled";
export type TemplateFormat = "Html" | "Blocks";

export interface CampaignChannelContent {
  subject: string;
  description: string;
  templateId: string;
  imageUrl: string;
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
  subject: string;
  description: string;
  templateId?: string | null;
  imageUrl?: string | null;
  channelContents?: Partial<Record<CampaignChannel, CampaignChannelContent>>;
  createdById?: string;
  schedule?: CampaignSchedule | null;
}

export interface CreateCampaignInput {
  title: string;
  subject: string;
  description: string;
  campaignType?: CampaignType;
  channels: CampaignChannel[];
  targetAudience?: string;
  targetCustomerIds?: string[];
  targetEmails?: string[];
  scheduleType: ScheduleType;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  templateId?: string;
  channelContents?: Partial<Record<CampaignChannel, CampaignChannelContent>>;
  status?: CampaignStatus;
}

export interface UpdateCampaignInput {
  title?: string;
  subject?: string;
  description?: string;
  campaignType?: CampaignType;
  channels?: CampaignChannel[];
  targetAudience?: string;
  targetCustomerIds?: string[];
  targetEmails?: string[];
  scheduleType?: ScheduleType;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  templateId?: string;
  channelContents?: Partial<Record<CampaignChannel, CampaignChannelContent>>;
  status?: CampaignStatus;
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
  message: string;
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
