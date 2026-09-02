"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Rocket, Lock, Ban, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CampaignChannelBadge } from "@/components/features/campaigns/CampaignChannelBadge";
import { CampaignStatusBadge } from "@/components/features/campaigns/CampaignStatusBadge";
import {
  AnalyticsCard,
  CampaignMetaSummary,
  ChannelContentCard,
  DispatchResultCard,
} from "@/components/features/campaigns/CampaignDetailCards";
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
      <div data-testid="campaign-detail-loading" className="p-xl space-y-md max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-xl text-muted-foreground">Campaign not found.</div>;
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
      setBusy(false);
    }
  }

  function exportReport() {
    const report = buildReport(campaign!, analytics);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaign!.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-5xl mx-auto">
      <button
        type="button"
        onClick={() => router.push("/campaigns")}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </button>

      {/* Title + status/channel badges + state actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-md">
        <div className="flex flex-wrap items-center gap-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {campaign.title}
          </h1>
          <CampaignStatusBadge status={campaign.status} />
          {campaign.channels.map((c) => (
            <CampaignChannelBadge key={c} channel={c} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit Campaign
              </Button>
              <Button size="sm" onClick={launch} disabled={busy}>
                <Rocket className="w-4 h-4 mr-1" />
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
                        <Lock className="w-4 h-4 mr-1" />
                        Edit Details
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Limited editing while live</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="destructive" size="sm" onClick={endCampaign} disabled={busy}>
                <Ban className="w-4 h-4 mr-1" />
                {busy ? "Ending…" : "End Campaign"}
              </Button>
            </>
          )}
          {isEnded && (
            <>
              <Button variant="outline" size="sm" onClick={duplicate} disabled={busy}>
                <Copy className="w-4 h-4 mr-1" />
                Duplicate Campaign
              </Button>
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="w-4 h-4 mr-1" />
                Export Report
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && <div className="p-md text-destructive text-base">{actionError}</div>}

      {/* Metadata summary */}
      <CampaignMetaSummary
        segmentName={segmentName}
        recipientCount={recipientCount}
        additionalEmails={campaign.targetEmails}
        createdAt={campaign.createdAt}
        updatedAt={campaign.schedule?.nextRunAt}
      />

      {campaign.dispatchResult && <DispatchResultCard result={campaign.dispatchResult} />}
      {analytics && <AnalyticsCard analytics={analytics} />}

      {/* Configured Distribution Channels */}
      <div className="space-y-md">
        <h2 className="text-headline-sm font-bold text-foreground">
          Configured Distribution Channels
        </h2>
        {campaign.channelContents.map((content) => (
          <ChannelContentCard key={content.channel} content={content} />
        ))}
      </div>
    </div>
  );
}

// A self-contained JSON report for the Ended-state "Export Report" action.
function buildReport(campaign: Campaign, analytics: CampaignAnalytics | null) {
  return {
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    channels: campaign.channels,
    createdAt: campaign.createdAt,
    dispatchResult: campaign.dispatchResult ?? null,
    analytics: analytics ?? null,
  };
}
