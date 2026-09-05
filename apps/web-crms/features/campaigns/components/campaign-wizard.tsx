"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSegments } from "@/hooks/useSegments";
import { crmClient } from "@/lib/api/crm-client";
import { type ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import {
  ScheduleStep,
  toLocalInput,
  type ScheduleState,
} from "@/features/campaigns/components/schedule-step";
import { CampaignStepper } from "@/features/campaigns/components/campaign-stepper";
import { Step1Channels } from "@/features/campaigns/components/step1-channels";
import { Step2Audience, SYSTEM_PRESET_SEGMENTS } from "@/features/campaigns/components/step2-audience";
import { Step3Content } from "@/features/campaigns/components/step3-content";
import { StepReview } from "@/features/campaigns/components/step-review";
import { CampaignCancelModal } from "@/features/campaigns/components/campaign-cancel-modal";
import type { Campaign } from "@/types/campaign";
import {
  useCampaignWizardState,
  NO_SEGMENT,
  STEP_PHASE,
  type Step,
} from "@/features/campaigns/hooks/use-campaign-wizard-state";

export function CampaignWizard({ existing }: { existing?: Campaign }) {
  const { data: segments } = useSegments();

  const {
    router,
    step,
    setStep,
    showCancelModal,
    setShowCancelModal,
    title,
    setTitle,
    channels,
    segmentId,
    setSegmentId,
    emails,
    setEmails,
    contents,
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
  } = useCampaignWizardState(existing);

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
            <StepReview
              title={title}
              channels={channels}
              emailSelected={emailSelected}
              segmentId={segmentId}
              segments={segments}
              schedule={schedule}
            />
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
                  Boolean((step === "Platform" && !canProceedPlatform) ||
                  (step === "Audience" && !canProceedAudience))
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
      <CampaignCancelModal
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
        onDiscardAndLeave={() => {
          setShowCancelModal(false);
          router.push("/campaigns");
        }}
        onSaveDraft={saveDraft}
        submitting={submitting}
        canProceedPlatform={canProceedPlatform}
        step={step}
      />
    </div>
  );
}
