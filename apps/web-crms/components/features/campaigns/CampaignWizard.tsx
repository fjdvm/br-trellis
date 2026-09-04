"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSegments } from "@/hooks/useSegments";
import { crmClient } from "@/lib/api/crm-client";
import { type ChannelContentState } from "@/components/features/campaigns/ChannelContentForm";
import {
  ScheduleStep,
  toLocalInput,
  type ScheduleState,
} from "@/components/features/campaigns/ScheduleStep";
import { CampaignStepper } from "@/components/features/campaigns/CampaignStepper";
import { Step1Channels } from "@/components/features/campaigns/Step1Channels";
import { Step2Audience, SYSTEM_PRESET_SEGMENTS } from "@/components/features/campaigns/Step2Audience";
import { Step3Content } from "@/components/features/campaigns/Step3Content";
import type {
  Campaign,
  CampaignChannel,
  CampaignChannelContentInput,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/types/campaign";

const NO_SEGMENT = "__none__";

type Step = "Platform" | "Audience" | "Content" | "Schedule" | "Review";

const STEP_PHASE: Record<Step, 0 | 1 | 2> = {
  Platform: 0,
  Audience: 1,
  Content: 2,
  Schedule: 2,
  Review: 2,
};

export function CampaignWizard({ existing }: { existing?: Campaign }) {
  const router = useRouter();
  const { data: segments } = useSegments();

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

  function toggleChannel(channel: CampaignChannel) {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  }

  function updateContent(channel: CampaignChannel, patch: Partial<ChannelContentState>) {
    setContents((prev) => ({ ...prev, [channel]: { ...prev[channel], ...patch } }));
  }

  function goNext() {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  }
  function goBack() {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  }

  function buildChannelContents(): CampaignChannelContentInput[] {
    return channels.map((channel) => {
      const c = contents[channel] ?? {};
      // For block templates, serialise blockValues as JSON into the body field
      // so the renderer can reconstruct the filled-in blocks later.
      const body = c.blockValues && Object.keys(c.blockValues).length > 0
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

  const canProceedPlatform = title.trim().length > 0 && channels.length > 0;

  const parsedEmailCount = emails
    .split(/[,\n]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length;
  const noSegmentSelected = segmentId === NO_SEGMENT;
  const canProceedAudience = !noSegmentSelected || parsedEmailCount > 0;

  const stepNumber = steps.indexOf(step) + 1;
  const currentPhase = STEP_PHASE[step];

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Return to campaigns list"
          onClick={() => setShowCancelModal(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>
      </div>

      {/* Stepper Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-xs">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {existing ? "Edit Campaign" : "Create Campaign"}
          </h1>
          <p className="text-body-md text-muted-foreground">
            Configure delivery pipelines, target segments, and tailored creative variants.
          </p>
        </div>
        <CampaignStepper current={currentPhase} />
      </div>

      {error && <div className="p-md text-destructive text-base bg-destructive/10 rounded-lg border border-destructive/20">{error}</div>}

      {/* Main Wizard Card */}
      <Card className="shadow-none border-border overflow-hidden">
        {/* Section Header Inside Card */}
        <div className="p-6 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2
              data-testid="wizard-step-title"
              className="text-headline-md font-bold text-foreground"
            >
              {step === "Platform" ? "Select Campaign Channels" : step}
            </h2>
          </div>
        </div>

        {/* Wizard Step Content */}
        <CardContent className="p-6">
          {step === "Platform" && (
            <Step1Channels
              title={title}
              channels={channels}
              onTitleChange={setTitle}
              onToggleChannel={toggleChannel}
            />
          )}

          {step === "Audience" && (
            <Step2Audience
              segments={segments}
              segmentId={segmentId}
              onSegmentIdChange={setSegmentId}
              emails={emails}
              onEmailsChange={setEmails}
              emailsRequired={noSegmentSelected}
            />
          )}

          {step === "Content" && (
            <Step3Content
              channels={channels}
              contents={contents}
              onUpdateContent={updateContent}
              onSaveDraft={saveDraft}
            />
          )}

          {step === "Schedule" && (
            <ScheduleStep
              emailSelected={emailSelected}
              hasStorefrontChannel={hasStorefrontChannel}
              value={schedule}
              onChange={(patch) => setSchedule((prev) => ({ ...prev, ...patch }))}
            />
          )}

          {step === "Review" && (
            <div className="space-y-md">
              <h3 className="text-headline-md font-bold text-foreground">
                Review Campaign Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md bg-muted/30 p-md rounded-lg text-base">
                <div>
                  <span className="text-muted-foreground block font-medium">Campaign Title</span>
                  <span className="font-semibold text-foreground">{title || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Selected Channels</span>
                  <span className="font-semibold text-foreground">
                    {channels.join(", ") || "None"}
                  </span>
                </div>
                {emailSelected && (
                  <div>
                    <span className="text-muted-foreground block font-medium">Target Audience</span>
                    <span className="font-semibold text-foreground">
                      {segmentId !== NO_SEGMENT
                        ? [...SYSTEM_PRESET_SEGMENTS, ...segments].find((s) => s.id === segmentId)?.name ?? segmentId
                        : "Custom email addresses"}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block font-medium">Schedule</span>
                  <span className="font-semibold text-foreground">
                    {schedule.scheduleType === "SendNow"
                      ? "Send Immediately"
                      : `Scheduled (${schedule.startDate || "TBD"} – ${
                          schedule.endDate || "No end date"
                        })`}
                  </span>
                </div>
              </div>

              <p className="text-base text-muted-foreground">
                Clicking <strong>Save Draft</strong> creates a pending draft campaign. You can preview,
                test, and launch it whenever you are ready.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer Actions inside Card */}
        <div className="p-6 bg-muted/40 border-t border-border flex items-center justify-between">
          <div>
            {step === "Platform" ? (
              <Button variant="ghost" onClick={() => setShowCancelModal(true)}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === "Platform" && !canProceedPlatform && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                At least one channel required
              </span>
            )}
            {step === "Audience" && !canProceedAudience && (
              <span className="hidden sm:inline text-xs text-destructive">
                At least one email address required
              </span>
            )}
            {step === "Content" ? (
              <>
                <Button variant="outline" onClick={saveDraft} disabled={submitting}>
                  {submitting ? "Saving…" : "Save Draft"}
                </Button>
                <Button onClick={goNext} disabled={submitting} className="gap-1.5 shadow-sm">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : step === "Review" ? (
              <>
                <Button variant="outline" onClick={saveDraft} disabled={submitting}>
                  {submitting ? "Saving…" : "Save Draft"}
                </Button>
                <Button onClick={saveAndLaunch} disabled={submitting} className="shadow-sm">
                  {submitting ? "Launching…" : "Launch Now"}
                </Button>
              </>
            ) : (
              <Button
                onClick={goNext}
                disabled={
                  (step === "Platform" && !canProceedPlatform) ||
                  (step === "Audience" && !canProceedAudience)
                }
                className="gap-1.5 shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Save Draft / Cancel Confirmation Modal */}
      {showCancelModal && (
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="max-w-md border border-gray-200 dark:border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Save Campaign Draft?</DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Would you like to save your campaign as a draft before leaving?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0 sm:justify-between flex-col-reverse sm:flex-row">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowCancelModal(false);
                  router.push("/campaigns");
                }}
              >
                Discard & Leave
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                  Continue Editing
                </Button>
                <Button
                  onClick={async () => {
                    setShowCancelModal(false);
                    await saveDraft();
                  }}
                  disabled={submitting || (step === "Platform" && !canProceedPlatform)}
                >
                  Save Draft
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
