"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import type {
  Campaign,
  CampaignChannel,
  CampaignChannelContentInput,
  CreateCampaignInput,
  UpdateCampaignInput,
} from "@/types/campaign";

const NO_SEGMENT = "__none__";

type Step = "Platform" | "Audience" | "Content" | "Review";

/** The Channels selectable in the wizard. */
const ALL_CHANNELS: CampaignChannel[] = ["Email", "Banner", "Popup"];

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

  const emailSelected = channels.includes("Email");

  // The ordered set of steps; Audience is skipped when Email isn't selected.
  const steps = useMemo<Step[]>(() => {
    return emailSelected
      ? ["Platform", "Audience", "Content", "Review"]
      : ["Platform", "Content", "Review"];
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
        scheduleType: "SendNow",
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

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-4xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          {existing ? "Edit Campaign" : "New Campaign"}
        </h1>
        <p className="text-body-md text-muted-foreground">
          Step {steps.indexOf(step) + 1} of {steps.length}: {step}
        </p>
      </div>

      {error && <div className="p-md text-destructive text-base">{error}</div>}

      <Card className="shadow-none border-border">
        <CardHeader className="p-lg pb-md">
          <CardTitle data-testid="wizard-step-title" className="text-title-lg font-bold">{step}</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-lg">
          {step === "Platform" && (
            <div className="space-y-lg">
              <div className="space-y-sm">
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
                <div className="flex flex-col gap-sm">
                  {ALL_CHANNELS.map((channel) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`channel-${channel}`}
                        aria-label={channel}
                        checked={channels.includes(channel)}
                        onCheckedChange={() => toggleChannel(channel)}
                      />
                      <span className="text-base">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "Audience" && emailSelected && (
            <div className="space-y-lg">
              <div className="space-y-sm">
                <Label htmlFor="segment-select">Segment</Label>
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
                <Label htmlFor="additional-emails">Additional Emails</Label>
                <Textarea
                  id="additional-emails"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="Comma-separated addresses for recipients not in a segment"
                />
              </div>
            </div>
          )}

          {step === "Content" && (
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

          <div className="flex items-center justify-between pt-md border-t border-border">
            <Button variant="outline" onClick={goBack} disabled={steps.indexOf(step) === 0}>
              Back
            </Button>
            {step === "Review" ? (
              <Button onClick={saveDraft} disabled={submitting}>
                {submitting ? "Saving…" : "Save Draft"}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={step === "Platform" && !canProceedPlatform}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
