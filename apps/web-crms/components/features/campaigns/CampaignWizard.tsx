"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Step2Audience } from "@/components/features/campaigns/Step2Audience";
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

  const canProceedPlatform = title.trim().length > 0 && channels.length > 0;
  const stepNumber = steps.indexOf(step) + 1;
  const currentPhase = STEP_PHASE[step];

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <Badge variant="secondary" className="uppercase tracking-wider text-xs px-3 py-1 font-semibold">
          {existing ? "Editing Draft" : "Campaign Draft #CMP-9042"}
        </Badge>
      </div>

      {/* Stepper Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-xs">
          <h1 className="text-display-lg font-bold tracking-tight text-foreground">
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
        <div className="px-lg py-md bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Step {stepNumber} of {steps.length}
            </span>
            <h2
              data-testid="wizard-step-title"
              className="text-headline-md font-bold text-foreground mt-0.5"
            >
              {step === "Platform" ? "Select Campaign Channels" : step}
            </h2>
          </div>
        </div>

        <CardContent className="p-lg space-y-lg">
          {step === "Platform" && (
            <Step1Channels
              title={title}
              onTitleChange={setTitle}
              channels={channels}
              onToggleChannel={toggleChannel}
            />
          )}

          {step === "Audience" && emailSelected && (
            <Step2Audience
              segments={segments}
              segmentId={segmentId}
              onSegmentIdChange={setSegmentId}
              emails={emails}
              onEmailsChange={setEmails}
            />
          )}

          {step === "Content" && (
            <Step3Content
              channels={channels}
              contents={contents}
              onUpdateContent={updateContent}
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
            <div className="space-y-lg text-base">
              <div className="p-md bg-muted/30 rounded-lg border border-border space-y-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold text-title-lg">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Review Campaign Configuration
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-xs text-sm">
                  <div>
                    <span className="text-muted-foreground">Title: </span>
                    <strong className="text-foreground">{title || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Channels: </span>
                    <strong className="text-foreground">{channels.join(", ") || "—"}</strong>
                  </div>
                  {emailSelected && (
                    <div>
                      <span className="text-muted-foreground">Audience: </span>
                      <strong className="text-foreground">
                        {segmentId !== NO_SEGMENT
                          ? segments.find((s) => s.id === segmentId)?.name ?? segmentId
                          : "No segment"}
                        {emails.trim() ? ` (+${emails.split(/[,\n]/).filter(Boolean).length} emails)` : ""}
                      </strong>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Schedule: </span>
                    <strong className="text-foreground">{schedule.scheduleType}</strong>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Saving creates or updates the campaign as a Draft. You can launch it when ready from the detail view.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer Action Bar */}
        <div className="px-lg py-md bg-muted/40 border-t border-border flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/campaigns")}
              className="text-muted-foreground font-semibold"
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {step !== "Platform" && (
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            )}
            {step === "Platform" && channels.length === 0 && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                At least one channel required
              </span>
            )}
            {step === "Review" ? (
              <Button onClick={saveDraft} disabled={submitting} className="shadow-sm">
                {submitting ? "Saving…" : "Save Draft"}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={step === "Platform" && !canProceedPlatform}
                className="gap-1.5 shadow-sm"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
