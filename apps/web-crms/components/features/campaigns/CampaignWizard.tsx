"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSegments } from "@/hooks/useSegments";
import { crmClient } from "@/lib/api/crm-client";
import {
  ChannelContentForm,
  type ChannelContentState,
} from "@/components/features/campaigns/ChannelContentForm";
import {
  ScheduleStep,
  toLocalInput,
  type ScheduleState,
} from "@/components/features/campaigns/ScheduleStep";
import { CampaignStepper } from "@/components/features/campaigns/CampaignStepper";
import {
  CHANNEL_META,
  ChannelSelectCard,
} from "@/components/features/campaigns/ChannelSelectCard";
import type {
  Campaign,
  CampaignChannel,
  CampaignChannelContentInput,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/types/campaign";

const NO_SEGMENT = "__none__";

type Step = "Platform" | "Audience" | "Content" | "Schedule" | "Review";

// The stepper the wireframe shows is a 3-phase flow: Channels, Audience,
// Content. Schedule + Review are folded into the "Content" phase visually
// (they're still discrete steps in the machine so scheduling and a final
// confirmation remain available before saving the Draft).
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
  const [emails, setEmails] = useState<string>((existing?.targetEmails ?? []).join(", "));
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

  // The ordered set of steps; Audience is skipped when Email isn't selected.
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
      {/* Back link + draft badge */}
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <Badge variant="secondary" className="uppercase tracking-wider">
          {existing ? "Editing Draft" : "Draft"}
        </Badge>
      </div>

      {/* Title + stepper */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {existing ? "Edit Campaign" : "Create Campaign"}
          </h1>
          <p className="text-body-md text-muted-foreground">
            Configure delivery channels, target audience, and creative content.
          </p>
        </div>
        <CampaignStepper current={currentPhase} />
      </div>

      {error && <div className="p-md text-destructive text-base">{error}</div>}

      <Card className="shadow-none border-border overflow-hidden">
        {/* Section header inside card */}
        <div className="px-lg py-md bg-muted/40 border-b border-border">
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Step {stepNumber} of {steps.length}
          </span>
          <h2
            data-testid="wizard-step-title"
            className="text-title-lg font-bold text-foreground mt-0.5"
          >
            {step}
          </h2>
        </div>

        <CardContent className="p-lg space-y-lg">
          {step === "Platform" && (
            <div className="space-y-lg">
              <div className="space-y-sm max-w-xl">
                <Label htmlFor="campaign-title">Campaign Title</Label>
                <Input
                  id="campaign-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Spring Sale 2026"
                />
              </div>
              <div className="space-y-sm">
                <Label>Distribution Channels</Label>
                <div className="flex flex-col gap-md">
                  {CHANNEL_META.map((meta) => (
                    <ChannelSelectCard
                      key={meta.channel}
                      meta={meta}
                      checked={channels.includes(meta.channel)}
                      onToggle={() => toggleChannel(meta.channel)}
                    />
                  ))}
                </div>
                {channels.length === 0 && (
                  <p className="text-sm text-muted-foreground">At least one channel required.</p>
                )}
              </div>
            </div>
          )}

          {step === "Audience" && emailSelected && (
            <div className="space-y-lg">
              <div className="space-y-sm">
                <Label htmlFor="segment-select">Customer Segment</Label>
                <Select value={segmentId} onValueChange={setSegmentId}>
                  <SelectTrigger id="segment-select" aria-label="Segment">
                    <SelectValue placeholder="Choose a segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SEGMENT}>No segment</SelectItem>
                    {segments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.memberCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-sm">
                <div className="flex items-center gap-2">
                  <Label htmlFor="additional-emails">Additional Emails</Label>
                  <Badge variant="secondary">Optional</Badge>
                </div>
                <Textarea
                  id="additional-emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Enter one email per line or separate by commas"
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  Manually append ad-hoc recipients not currently in a CRM segment.
                </p>
              </div>
            </div>
          )}

          {step === "Content" && (
            <div className="space-y-lg">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-md">
                <Info className="w-5 h-5 text-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-semibold text-foreground">Draft-First Policy</p>
                  <p className="text-sm text-muted-foreground">
                    All campaigns are saved as a Draft. Review and explicit launch happen from the
                    Campaign Detail view.
                  </p>
                </div>
              </div>
              <div className="space-y-xl">
                {channels.map((channel) => (
                  <ChannelContentForm
                    key={channel}
                    channel={channel}
                    value={contents[channel] ?? {}}
                    onChange={(patch) => updateContent(channel, patch)}
                  />
                ))}
              </div>
            </div>
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
            <div className="space-y-md text-base">
              <div>
                <span className="text-muted-foreground">Title: </span>
                {title || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Channels: </span>
                {channels.join(", ") || "—"}
              </div>
              {emailSelected && (
                <div>
                  <span className="text-muted-foreground">Audience: </span>
                  {segmentId !== NO_SEGMENT
                    ? segments.find((s) => s.id === segmentId)?.name ?? segmentId
                    : "No segment"}
                  {emails.trim() ? ` + ${emails}` : ""}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Saving creates the campaign as a Draft. You can launch it later.
              </p>
            </div>
          )}
        </CardContent>

        {/* Footer action bar */}
        <div className="px-lg py-md bg-muted/40 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/campaigns")}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
            <Button variant="outline" onClick={goBack} disabled={steps.indexOf(step) === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {step === "Platform" && channels.length === 0 && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                At least one channel required
              </span>
            )}
            {step === "Review" ? (
              <Button onClick={saveDraft} disabled={submitting}>
                {submitting ? "Saving…" : "Save Draft"}
              </Button>
            ) : (
              <Button onClick={goNext} disabled={step === "Platform" && !canProceedPlatform}>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
