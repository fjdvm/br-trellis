"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignChannelBadge } from "@/components/features/campaigns/CampaignChannelBadge";
import { CampaignStatusBadge } from "@/components/features/campaigns/CampaignStatusBadge";
import { crmClient } from "@/lib/api/crm-client";
import { useCampaign } from "@/hooks/useCampaign";
import { useSegments } from "@/hooks/useSegments";
import type { CampaignAnalytics, CampaignChannelContent } from "@/types/campaign";

export function CampaignDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: campaign, isLoading, refetch } = useCampaign(id);
  const { data: segments } = useSegments();
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);

  const hasDispatch = Boolean(campaign?.dispatchResult);

  useEffect(() => {
    if (!campaign || !campaign.channels.includes("Email") || !hasDispatch) {
      setAnalytics(null);
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
      <div data-testid="campaign-detail-loading" className="p-xl space-y-md max-w-4xl mx-auto">
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
  const isDraft = campaign.status === "Draft";

  async function launch() {
    setLaunching(true);
    setLaunchError(null);
    try {
      await crmClient.campaigns.updateStatus(campaign!.id, "Active");
      await refetch();
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Failed to launch campaign.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/campaigns")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {isDraft && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" onClick={launch} disabled={launching}>
              <Rocket className="w-4 h-4 mr-1" />
              {launching ? "Launching…" : "Launch"}
            </Button>
          </div>
        )}
      </div>

      {launchError && <div className="p-md text-destructive text-base">{launchError}</div>}

      <div className="space-y-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {campaign.title}
          </h1>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {campaign.channels.map((c) => (
            <CampaignChannelBadge key={c} channel={c} />
          ))}
        </div>
      </div>

      {campaign.channels.includes("Email") && (
        <Card className="shadow-none border-border">
          <CardHeader className="p-lg pb-md">
            <CardTitle className="text-title-lg font-bold">Audience</CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0 space-y-sm text-base">
            <div>
              <span className="text-muted-foreground">Segment: </span>
              {segmentName ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Additional emails: </span>
              {campaign.targetEmails && campaign.targetEmails.length > 0
                ? campaign.targetEmails.join(", ")
                : "—"}
            </div>
          </CardContent>
        </Card>
      )}

      {campaign.dispatchResult && (
        <Card className="shadow-none border-border">
          <CardHeader className="p-lg pb-md">
            <CardTitle className="text-title-lg font-bold">Dispatch Result</CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0 space-y-sm text-base">
            <div className="flex flex-wrap gap-lg">
              <div>
                <span className="text-muted-foreground">Recipients: </span>
                {campaign.dispatchResult.totalRecipients}
              </div>
              <div>
                <span className="text-muted-foreground">Sent: </span>
                {campaign.dispatchResult.sentCount}
              </div>
              <div>
                <span className="text-muted-foreground">Failed: </span>
                {campaign.dispatchResult.failedCount}
              </div>
            </div>
            {campaign.dispatchResult.errors.length > 0 && (
              <ul className="text-sm text-destructive list-disc pl-5">
                {campaign.dispatchResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {analytics && (
        <Card className="shadow-none border-border">
          <CardHeader className="p-lg pb-md">
            <CardTitle className="text-title-lg font-bold">Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0 space-y-md text-base">
            <div className="flex flex-wrap gap-lg">
              <div>
                <span className="text-muted-foreground">Open Rate: </span>
                {analytics.openRate}%
              </div>
              <div>
                <span className="text-muted-foreground">Click Rate: </span>
                {analytics.clickRate}%
              </div>
              <div>
                <span className="text-muted-foreground">Opened: </span>
                {analytics.openedCount}
              </div>
              <div>
                <span className="text-muted-foreground">Clicked: </span>
                {analytics.clickedCount}
              </div>
            </div>
            {analytics.linkPerformance.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Link performance</p>
                <ul className="text-sm space-y-1">
                  {analytics.linkPerformance.map((l) => (
                    <li key={l.destinationUrl} className="flex justify-between gap-4">
                      <span className="truncate">{l.destinationUrl}</span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {l.totalClicks} clicks ({l.shareOfTotalClicks}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {campaign.channelContents.map((content) => (
        <ChannelContentCard key={content.channel} content={content} />
      ))}
    </div>
  );
}

function ChannelContentCard({ content }: { content: CampaignChannelContent }) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="p-lg pb-md flex flex-row items-center gap-2">
        <CardTitle className="text-title-lg font-bold">Content</CardTitle>
        <CampaignChannelBadge channel={content.channel} />
      </CardHeader>
      <CardContent className="p-lg pt-0 space-y-sm text-base">
        {content.subject && (
          <div>
            <span className="text-muted-foreground">Subject: </span>
            {content.subject}
          </div>
        )}
        {content.heading && (
          <div>
            <span className="text-muted-foreground">Heading: </span>
            {content.heading}
          </div>
        )}
        {content.body && <p className="whitespace-pre-wrap">{content.body}</p>}
        {content.imageUrl && (
          <div className="text-sm text-muted-foreground">Image: {content.imageUrl}</div>
        )}
        {content.linkUrl && (
          <div className="text-sm text-muted-foreground">Link: {content.linkUrl}</div>
        )}
        {content.ctaText && (
          <div className="text-sm text-muted-foreground">
            CTA: {content.ctaText} → {content.ctaUrl ?? "—"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
