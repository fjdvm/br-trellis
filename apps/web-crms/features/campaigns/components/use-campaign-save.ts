import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { crmClient } from "@/lib/api/crm-client";
import { type ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import type { ScheduleState } from "@/features/campaigns/components/schedule-step";
import type {
  Campaign,
  CampaignChannel,
  CampaignChannelContentInput,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/features/campaigns/types";

const NO_SEGMENT = "__none__";

interface UseCampaignSaveProps {
  existing?: Campaign;
  title: string;
  channels: CampaignChannel[];
  segmentId: string;
  emails: string;
  contents: Record<string, ChannelContentState>;
  schedule: ScheduleState;
}

export function useCampaignSave({
  existing,
  title,
  channels,
  segmentId,
  emails,
  contents,
  schedule,
}: UseCampaignSaveProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildChannelContents(): CampaignChannelContentInput[] {
    return channels.map((channel) => {
      const c = contents[channel] ?? {};
      const body =
        c.blockValues && Object.keys(c.blockValues).length > 0
          ? JSON.stringify(c.blockValues)
          : (c.body ?? null);
      return {
        channel,
        templateId: c.templateId ?? null,
        subject: c.subject ?? null,
        heading: c.heading ?? null,
        body,
        imageUrl: c.imageUrl ?? null,
        linkUrl: c.linkUrl ?? null,
        ctaText: c.ctaText ?? null,
        ctaUrl: c.ctaUrl ?? null,
        dismissible: c.dismissible ?? false,
      };
    });
  }

  async function saveDraft() {
    setSubmitting(true);
    setError(null);
    try {
      const audience = segmentId !== NO_SEGMENT ? segmentId : undefined;
      const targetEmails = emails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const payload: CreateCampaignInput = {
        title: title.trim(),
        channels,
        targetAudience: audience,
        targetEmails: targetEmails.length > 0 ? targetEmails : undefined,
        scheduleType: schedule.scheduleType,
        startDate: schedule.startDate ? new Date(schedule.startDate).toISOString() : undefined,
        endDate: schedule.endDate ? new Date(schedule.endDate).toISOString() : undefined,
        channelContents: buildChannelContents(),
      };

      if (existing) {
        const update: UpdateCampaignInput = { ...payload };
        await crmClient.campaigns.update(existing.id, update);
        router.push(`/campaigns/${existing.id}`);
      } else {
        const created = await crmClient.campaigns.create(payload);
        router.push(`/campaigns/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save campaign.");
      setSubmitting(false);
    }
  }

  async function saveAndLaunch() {
    setSubmitting(true);
    setError(null);
    try {
      const audience = segmentId !== NO_SEGMENT ? segmentId : undefined;
      const targetEmails = emails
        .split(/[,\n]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const payload: CreateCampaignInput = {
        title: title.trim(),
        channels,
        targetAudience: audience,
        targetEmails: targetEmails.length > 0 ? targetEmails : undefined,
        scheduleType: schedule.scheduleType,
        startDate: schedule.startDate ? new Date(schedule.startDate).toISOString() : undefined,
        endDate: schedule.endDate ? new Date(schedule.endDate).toISOString() : undefined,
        channelContents: buildChannelContents(),
      };

      let campaignId = existing?.id;
      if (existing) {
        const update: UpdateCampaignInput = { ...payload };
        await crmClient.campaigns.update(existing.id, update);
      } else {
        const created = await crmClient.campaigns.create(payload);
        campaignId = created.id;
      }
      if (campaignId) {
        await crmClient.campaigns.updateStatus(campaignId, "Active");
        router.push(`/campaigns/${campaignId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch campaign.");
      setSubmitting(false);
    }
  }

  return { submitting, error, setError, saveDraft, saveAndLaunch };
}
