"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Rocket, Lock, StopCircle, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CampaignChannelBadge } from "@/features/campaigns/components/campaign-channel-badge";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { CampaignDraftView } from "@/features/campaigns/components/campaign-draft-view";
import { CampaignActiveView } from "@/features/campaigns/components/campaign-active-view";
import { CampaignEndedView } from "@/features/campaigns/components/campaign-ended-view";
import { CampaignDetailModals } from "@/features/campaigns/components/campaign-detail-modals";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";


import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { useSegments } from "@/features/segments/hooks/useSegments";
import type { Campaign, CampaignAnalytics } from "@/features/campaigns/types";

export function CampaignDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: campaign, isLoading, refetch } = useCampaign(id);
  const { data: segments } = useSegments();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const hasDispatch = Boolean(campaign?.dispatchResult);

  useEffect(() => {
    if (!campaign || !campaign.channels.includes("Email") || !hasDispatch) {
      return;
    }
    let mounted = true;
    campaignsApi
      .getAnalytics(campaign.id)
      .then((a) => mounted && setAnalytics(a))
      .catch(() => mounted && setAnalytics(null));
    return () => {
      mounted = false;
    };
  }, [campaign, hasDispatch]);

  if (isLoading) {
    return (
      <div data-testid="campaign-detail-loading" className="p-xl space-y-md mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-xl text-muted-foreground text-base">Campaign not found.</div>;
  }

  const segmentName = campaign.targetAudience
    ? segments.find((s) => s.id === campaign.targetAudience)?.name ?? campaign.targetAudience
    : null;
  const recipientCount = campaign.targetEmails?.length ?? 0;
  const isDraft = campaign.status === "Draft";
  const isActive = campaign.status === "Active";
  const isEnded = campaign.status === "Ended";

  async function launch() {
    setBusy(true);
    setActionError(null);
    setShowLaunchModal(false);
    try {
      await campaignsApi.updateStatus(campaign!.id, "Active");
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to launch campaign.");
    } finally {
      setBusy(false);
    }
  }

  async function endCampaign() {
    setBusy(true);
    setActionError(null);
    setShowEndModal(false);
    try {
      await campaignsApi.updateStatus(campaign!.id, "Ended");
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to end campaign.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    setBusy(true);
    setActionError(null);
    try {
      const created = await campaignsApi.create({
        title: `${campaign!.title} (Copy)`,
        channels: campaign!.channels,
        targetAudience: campaign!.targetAudience,
        targetEmails: campaign!.targetEmails,
        scheduleType: campaign!.schedule?.scheduleType,
        channelContents: campaign!.channelContents.map((c) => ({ ...c })),
      });
      router.push(`/campaigns/${created.id}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to duplicate campaign.");
    } finally {
      setBusy(false);
    }
  }

  function exportReport() {
    alert("Exporting report...");
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div className="flex items-center gap-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/campaigns")}
            aria-label="Back to campaigns"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-headline-md font-bold text-foreground">
              {campaign.title}
            </h1>
            <div className="flex flex-wrap items-center gap-xs mt-1.5">
              <CampaignStatusBadge status={campaign.status} />
              {campaign.channels.map((ch) => (
                <CampaignChannelBadge key={ch} channel={ch} />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons depending on State */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit Campaign
              </Button>
              <Button size="sm" onClick={() => launch()} disabled={busy} className="shadow-sm">
                <Rocket className="w-4 h-4 mr-1.5" />
                {busy ? "Launching…" : "Launch Campaign"}
              </Button>
            </>
          )}
          {isActive && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="sm" disabled>
                        <Lock className="w-4 h-4 mr-1.5" />
                        Edit Details
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Limited editing while live</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="destructive" size="sm" onClick={() => setShowEndModal(true)} disabled={busy}>
                <StopCircle className="w-4 h-4 mr-1.5" />
                {busy ? "Ending…" : "End Campaign"}
              </Button>
            </>
          )}
          {isEnded && (
            <>
              <Button variant="outline" size="sm" onClick={duplicate} disabled={busy}>
                <Copy className="w-4 h-4 mr-1.5" />
                Duplicate Campaign
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="w-4 h-4 mr-1.5" />
                Export Report
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-md text-destructive text-base bg-destructive/10 rounded-lg border border-destructive/20">
          {actionError}
        </div>
      )}

      {/* Render State Specific View */}
      {isDraft && (
        <CampaignDraftView
          campaign={campaign}
          recipientCount={recipientCount}
          segmentName={segmentName}
          onLaunch={() => setShowLaunchModal(true)}
          busy={busy}
        />
      )}

      {isActive && (
        <CampaignActiveView
          campaign={campaign}
          recipientCount={recipientCount}
          segmentName={segmentName}
          analytics={analytics}
          onEndCampaign={() => setShowEndModal(true)}
          busy={busy}
        />
      )}

      {isEnded && (
        <CampaignEndedView
          campaign={campaign}
          recipientCount={recipientCount}
          segmentName={segmentName}
          analytics={analytics}
        />
      )}

      {/* Launch & End Campaign Modals */}
      <CampaignDetailModals
        campaign={campaign}
        recipientCount={recipientCount}
        showLaunchModal={showLaunchModal}
        setShowLaunchModal={setShowLaunchModal}
        showEndModal={showEndModal}
        setShowEndModal={setShowEndModal}
        onLaunch={launch}
        onEndCampaign={endCampaign}
        busy={busy}
      />
    </div>
  );
}
