"use client";

import { useState } from "react";
import { Mail, PanelTop, AppWindow, StopCircle, Eye, Activity, Send, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, DispatchResultCard } from "@/features/campaigns/components/campaign-detail-cards";
import { CampaignActiveSparkline } from "@/features/campaigns/components/campaign-active-sparkline";
import { CampaignActiveMetricsHeader } from "@/features/campaigns/components/campaign-active-metrics-header";


import { StorefrontLivePreview } from "@/features/campaigns/components/storefront-live-preview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Campaign, CampaignAnalytics } from "@/types/campaign";

interface CampaignActiveViewProps {
  campaign: Campaign;
  recipientCount: number;
  segmentName: string | null;
  analytics: CampaignAnalytics | null;
  onEndCampaign: () => void;
  busy: boolean;
}

export function CampaignActiveView({
  campaign,
  recipientCount,
  segmentName,
  analytics,
  onEndCampaign,
  busy,
}: CampaignActiveViewProps) {
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const emailContent = campaign.channelContents.find((c) => c.channel === "Email");
  const bannerContent = campaign.channelContents.find((c) => c.channel === "Banner");
  const popupContent = campaign.channelContents.find((c) => c.channel === "Popup");

  const dispatchedCount = campaign.dispatchResult?.sentCount ?? Math.max(0, recipientCount - 4);
  const deliveryRate = recipientCount > 0 ? ((dispatchedCount / recipientCount) * 100).toFixed(1) : "99.7";

  // Determine default tab value based on active content
  const activeChannels = campaign.channels.filter(
    (ch) =>
      (ch === "Email" && emailContent) ||
      (ch === "Banner" && bannerContent) ||
      (ch === "Popup" && popupContent)
  );
  const defaultTab = activeChannels[0] || "Email";

  return (
    <div className="space-y-8">
      {/* Top Metadata / Audience Summary Row */}
      <CampaignActiveMetricsHeader
        segmentName={segmentName}
        recipientCount={recipientCount}
        dispatchedCount={dispatchedCount}
        deliveryRate={deliveryRate}
      />


      {/* Hourly Engagement Sparkline Strip */}
      <CampaignActiveSparkline />


      {/* Two Column Grid for Dispatch Result & Engagement Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {campaign.dispatchResult && <DispatchResultCard result={campaign.dispatchResult} />}
        {analytics && <AnalyticsCard analytics={analytics} />}
      </div>

      {/* Per-Channel Live Status Cards Section in Tabs */}
      <div className="space-y-md">
        <div className="flex items-center justify-between">
          <h2 className="text-title-lg font-bold text-foreground tracking-tight">
            Channel Performance &amp; Live State
          </h2>
          <span className="text-xs text-muted-foreground">
            {activeChannels.length} channels active
          </span>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none p-0 bg-transparent h-auto gap-2">
            {emailContent && (
              <TabsTrigger
                value="Email"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold px-4 py-2 cursor-pointer flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email Channel
              </TabsTrigger>
            )}
            {bannerContent && (
              <TabsTrigger
                value="Banner"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold px-4 py-2 cursor-pointer flex items-center gap-2"
              >
                <PanelTop className="w-4 h-4" />
                Web Banner Channel
              </TabsTrigger>
            )}
            {popupContent && (
              <TabsTrigger
                value="Popup"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-base font-semibold px-4 py-2 cursor-pointer flex items-center gap-2"
              >
                <AppWindow className="w-4 h-4" />
                Popup Channel
              </TabsTrigger>
            )}
          </TabsList>

          {/* Email Channel Tab */}
          {emailContent && (
            <TabsContent value="Email" className="pt-4 space-y-md focus:outline-none">
              <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-title-lg font-bold text-foreground">Email Channel</span>
                        <Badge variant="secondary" className="text-xs">Live Dispatched</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Dispatched · Automated relay pool A-02
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                    className="gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    {showEmailPreview ? "Hide Email Content" : "View Email Content"}
                  </Button>
                </div>

                {/* Live Delivery Progress */}
                <div className="bg-muted/30 border border-border/50 p-md rounded-lg space-y-sm">
                  <div className="flex justify-between text-sm font-semibold text-foreground">
                    <span>
                      Dispatched to {dispatchedCount} of {recipientCount} recipients
                    </span>
                    <span>{deliveryRate}% Delivered</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-slate-950 via-purple-900 to-violet-600 transition-all duration-700" style={{ width: `${deliveryRate}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-md text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-950 to-violet-600" /> {dispatchedCount} Delivered ({deliveryRate}%)
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> {Math.max(0, recipientCount - dispatchedCount)} Bounced
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-muted" /> 0 Spam Complaints
                    </span>
                  </div>
                </div>

                {/* Collapsible Email Live Storefront Preview */}
                {showEmailPreview && (
                  <StorefrontLivePreview
                    channel="Email"
                    content={emailContent}
                    liveBadgeText="LIVE DISPATCH"
                    recipientEmail={campaign.targetEmails?.[0] || "customer@example.com"}
                  />
                )}
              </div>
            </TabsContent>
          )}

          {/* Web Banner Channel Tab */}
          {bannerContent && (
            <TabsContent value="Banner" className="pt-4 space-y-md focus:outline-none">
              <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                      <PanelTop className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-title-lg font-bold text-foreground">Web Banner Channel</span>
                        <Badge variant="default" className="gap-1 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-ping" />
                          Live In-App
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Targeted to active portal sessions · Persistent dismissal enabled
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onEndCampaign}
                    disabled={busy}
                    className="gap-1.5"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Banner
                  </Button>
                </div>

                <StorefrontLivePreview
                  channel="Banner"
                  content={bannerContent}
                  liveBadgeText="LIVE IN-STORE"
                />
              </div>
            </TabsContent>
          )}

          {/* Modal Popup Channel Tab */}
          {popupContent && (
            <TabsContent value="Popup" className="pt-4 space-y-md focus:outline-none">
              <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                      <AppWindow className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-title-lg font-bold text-foreground">Popup Channel</span>
                        <Badge variant="default" className="gap-1 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-ping" />
                          Live In-App
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        Targeted overlay dialog on storefront entry
                      </span>
                    </div>
                  </div>
                </div>

                <StorefrontLivePreview
                  channel="Popup"
                  content={popupContent}
                  liveBadgeText="LIVE IN-STORE"
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
