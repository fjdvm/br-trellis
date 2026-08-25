export type CampaignStatus = "Draft" | "Active" | "Ended";
export type CampaignType = "Regular";
export type CampaignChannel = "Email" | "InApp";
export type ScheduleType = "SendNow" | "Scheduled" | "Recurring";
export type RecurrenceDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface CampaignChannelContent {
  subject: string;
  description: string;
  templateId: string;
  imageUrl: string;
}

export interface CampaignSchedule {
  scheduleType: ScheduleType;
  recurrenceDays?: RecurrenceDay[];
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
  recurrenceDays?: RecurrenceDay[];
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
  recurrenceDays?: RecurrenceDay[];
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
  contentHtml: string;
  thumbnailUrl?: string | null;
  channel: string;
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
