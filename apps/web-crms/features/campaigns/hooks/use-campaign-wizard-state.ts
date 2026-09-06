import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";
import { toLocalInput, type ScheduleState } from "@/features/campaigns/components/schedule-step";
import type { ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import type {
  Campaign,
  CampaignChannel,
  CampaignChannelContentInput,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/features/campaigns/types";

export const NO_SEGMENT = "__none__";

export type Step = "Platform" | "Audience" | "Content" | "Schedule" | "Review";

export const STEP_PHASE: Record<Step, 0 | 1 | 2> = {
  Platform: 0,
  Audience: 1,
  Content: 2,
  Schedule: 2,
  Review: 2,
};

export function useCampaignWizardState(existing?: Campaign) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("Platform");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [channels, setChannels] = useState<CampaignChannel[]>(existing?.channels ?? []);
  const [segmentId, setSegmentId] = useState<string>(existing?.targetAudience ?? NO_SEGMENT);
  const [emails, setEmails] = useState<string>((existing?.targetEmails ?? []).join("\n"));
  const [contents, setContents] = useState<Record<string, ChannelContentState>>(() => {
    const initial: Record<string, ChannelContentState> = {};
    for (const c of existing?.channelContents ?? []) {
      initial[c.channel] = {
        templateId: c.templateId ?? undefined,
        subject: c.subject ?? undefined,
        heading: c.heading ?? undefined,
        body: c.body ?? undefined,
        imageUrl: c.imageUrl ?? undefined,
        linkUrl: c.linkUrl ?? undefined,
        ctaText: c.ctaText ?? undefined,
        ctaUrl: c.ctaUrl ?? undefined,
        dismissible: c.dismissible ?? false,
      };
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleState>({
    scheduleType: existing?.schedule?.scheduleType ?? "SendNow",
    startDate: toLocalInput(existing?.schedule?.startDate),
    endDate: toLocalInput(existing?.schedule?.endDate),
  });

  const emailSelected = channels.includes("Email");
  const hasStorefrontChannel = channels.includes("Banner") || channels.includes("Popup");

  const steps = useMemo<Step[]>(() => {
    return emailSelected
      ? ["Platform", "Audience", "Content", "Schedule", "Review"]
      : ["Platform", "Content", "Schedule", "Review"];
  }, [emailSelected]);

  function goNext() {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }
  function goBack() {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }

  function toggleChannel(channel: CampaignChannel) {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  }

  function updateContent(channel: CampaignChannel, patch: Partial<ChannelContentState>) {
    setContents((prev) => ({ ...prev, [channel]: { ...prev[channel], ...patch } }));
  }

  function buildChannelContents(): CampaignChannelContentInput[] {
    return channels.map((channel) => {
      const c = contents[channel] ?? {};
      return {
        channel,
        templateId: c.templateId ?? null,
        subject: c.subject ?? null,
        heading: c.heading ?? null,
        body: c.body ?? null,
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
        await campaignsApi.update(existing.id, update);
        router.push(`/campaigns/${existing.id}`);
      } else {
        const created = await campaignsApi.create(payload);
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
        await campaignsApi.update(existing.id, update);
      } else {
        const created = await campaignsApi.create(payload);
        campaignId = created.id;
      }
      if (campaignId) {
        await campaignsApi.updateStatus(campaignId, "Active");
        router.push(`/campaigns/${campaignId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch campaign.");
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (title.trim() || channels.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title, channels]);

  return {
    router,
    step,
    setStep,
    showCancelModal,
    setShowCancelModal,
    title,
    setTitle,
    channels,
    setChannels,
    segmentId,
    setSegmentId,
    emails,
    setEmails,
    contents,
    setContents,
    submitting,
    error,
    schedule,
    setSchedule,
    emailSelected,
    hasStorefrontChannel,
    toggleChannel,
    updateContent,
    steps,
    goNext,
    goBack,
    saveDraft,
    saveAndLaunch,
  };
}
