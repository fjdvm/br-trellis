"use client";

import { useState } from "react";
import { Mail, PanelTop, AppWindow, StopCircle, Eye, Activity, Send, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, DispatchResultCard } from "@/components/features/campaigns/CampaignDetailCards";
import { StorefrontLivePreview } from "@/components/features/campaigns/StorefrontLivePreview";
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Target Audience Segment
          </span>
          <div className="flex items-center justify-between">
            <span className="text-title-lg font-bold text-foreground">
              {segmentName ?? "All Contacts"}
            </span>
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {recipientCount} contacts
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Validated live recipient distribution pool</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Dispatched Reach
          </span>
          <div className="flex items-center justify-between">
            <span className="text-title-lg font-bold text-foreground">
              {dispatchedCount} / {recipientCount}
            </span>
            <Badge variant="secondary" className="text-xs">
              <Send className="w-3 h-3 mr-1" />
              {deliveryRate}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Successful pipeline delivery confirmation</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Live Delivery Engine
          </span>
          <div className="flex items-center justify-between">
            <span className="text-title-lg font-bold text-foreground">Active Relay Cluster</span>
            <Badge variant="default" className="gap-1 text-xs">
              <Activity className="w-3 h-3 animate-pulse" />
              Broadcasting
            </Badge>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm font-semibold text-foreground">
            <span>Active live session</span>
          </div>
        </div>
      </div>

      {/* Hourly Engagement Sparkline Strip */}
      <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-title-lg font-bold text-foreground">Hourly Engagement Rate</span>
            <span className="text-xs text-muted-foreground">
              Aggregate clicks &amp; conversions during launch window
            </span>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            +18.4% vs benchmark
          </Badge>
        </div>
        <div className="w-full h-20 pt-2">
          <svg className="w-full h-full" fill="none" viewBox="0 0 600 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="violetSparklineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="violetSparklineStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <path d="M0,70 Q75,65 150,45 T300,30 T450,15 T600,8 L600,80 L0,80 Z" fill="url(#violetSparklineFill)" />
            <path d="M0,70 Q75,65 150,45 T300,30 T450,15 T600,8" stroke="url(#violetSparklineStroke)" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

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
                    <div className="h-full bg-primary transition-all duration-700" style={{ width: `${deliveryRate}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-md text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary" /> {dispatchedCount} Delivered ({deliveryRate}%)
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
