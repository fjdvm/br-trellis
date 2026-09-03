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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CampaignChannelBadge } from "@/components/features/campaigns/CampaignChannelBadge";
import { CampaignStatusBadge } from "@/components/features/campaigns/CampaignStatusBadge";
import { CampaignDraftView } from "@/components/features/campaigns/CampaignDraftView";
import { CampaignActiveView } from "@/components/features/campaigns/CampaignActiveView";
import { CampaignEndedView } from "@/components/features/campaigns/CampaignEndedView";
import { crmClient } from "@/lib/api/crm-client";
import { useCampaign } from "@/hooks/useCampaign";
import { useSegments } from "@/hooks/useSegments";
import type { Campaign, CampaignAnalytics } from "@/types/campaign";

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
    crmClient.campaigns
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
      await crmClient.campaigns.updateStatus(campaign!.id, "Active");
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
      await crmClient.campaigns.updateStatus(campaign!.id, "Ended");
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
      const created = await crmClient.campaigns.create({
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

      {/* Launch Confirmation Modal */}
      {showLaunchModal && (
        <Dialog open={showLaunchModal} onOpenChange={setShowLaunchModal}>
          <DialogContent className="max-w-md border border-gray-200 dark:border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Confirm Launch
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Are you sure you want to launch this campaign? This action will immediately trigger dispatches to{" "}
                <strong className="text-foreground">{recipientCount} recipients</strong> across{" "}
                {campaign.channels.length} {campaign.channels.length === 1 ? "channel" : "channels"}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowLaunchModal(false)}>
                Cancel
              </Button>
              <Button onClick={launch} disabled={busy} className="shadow-sm">
                {busy ? "Launching…" : "Confirm Launch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* End Campaign Confirmation Modal */}
      {showEndModal && (
        <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
          <DialogContent className="max-w-md border border-gray-200 dark:border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                <StopCircle className="w-5 h-5 text-destructive" />
                Confirm End Campaign
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Are you sure you want to end this active campaign? Active dispatches and banners will be stopped immediately.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setShowEndModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={endCampaign} disabled={busy}>
                {busy ? "Ending…" : "Confirm End Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
