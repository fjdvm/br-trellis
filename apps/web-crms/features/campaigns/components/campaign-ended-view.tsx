"use client";

import { useState } from "react";
import { Mail, PanelTop, AppWindow, MousePointerClick, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StorefrontLivePreview } from "@/features/campaigns/components/storefront-live-preview";
import type { Campaign, CampaignAnalytics } from "@/features/campaigns/types";

interface CampaignEndedViewProps {
  campaign: Campaign;
  recipientCount: number;
  segmentName: string | null;
  analytics: CampaignAnalytics | null;
}

export function CampaignEndedView({
  campaign,
  recipientCount,
  segmentName,
  analytics,
}: CampaignEndedViewProps) {
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const emailContent = campaign.channelContents.find((c) => c.channel === "Email");
  const bannerContent = campaign.channelContents.find((c) => c.channel === "Banner");
  const popupContent = campaign.channelContents.find((c) => c.channel === "Popup");

  const openRate = analytics ? analytics.openRate : 0;
  const clickRate = analytics ? analytics.clickRate : 0;
  const sentCount = campaign.dispatchResult?.sentCount ?? analytics?.sentCount ?? recipientCount;

  return (
    <div className="space-y-8">
      {/* Top Metadata Banner */}
      <div className="w-full bg-card border border-border rounded-xl p-lg shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="flex flex-col gap-xs">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Audience Cohort
            </span>
            <div className="flex items-baseline gap-xs">
              <span className="text-title-lg font-bold text-foreground">
                {segmentName ?? "Enterprise Clients"}
              </span>
              <span className="text-sm text-muted-foreground">({recipientCount})</span>
            </div>
            <span className="text-xs text-muted-foreground">Validated target segmentation group</span>
          </div>

          <div className="flex flex-col gap-xs md:border-l md:border-border md:pl-md">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Target Volume
            </span>
            <div className="flex items-baseline gap-xs">
              <span className="text-title-lg font-bold text-foreground">{recipientCount}</span>
              <span className="text-sm text-muted-foreground">contacts</span>
            </div>
            <span className="text-xs text-muted-foreground">Cross-channel aggregated reach</span>
          </div>

          <div className="flex flex-col gap-xs md:border-l md:border-border md:pl-md">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Campaign Lifecycle
            </span>
            <span className="text-title-lg font-bold text-foreground">Concluded on schedule</span>
            <span className="text-xs text-muted-foreground">18 days active window</span>
          </div>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="space-y-6">
        {/* Email Analytics Card */}
        {emailContent && (
          <div className="w-full bg-card border border-border rounded-xl p-lg shadow-xs space-y-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-title-lg font-bold text-foreground leading-tight">
                    Email Channel — Engagement Analytics
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Primary delivery channel • Concluded distribution
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                Ended
              </Badge>
            </div>

            {/* Key Engagement Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
              <Card className="shadow-none border-border/60 bg-muted/30">
                <CardContent className="p-5 pt-5 flex flex-col justify-between h-full">
                  <span className="text-xs text-muted-foreground font-medium">Total Sent</span>
                  <div className="flex flex-col mt-1">
                    <span className="text-headline-md font-bold text-foreground">{sentCount}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">99.7% delivery rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-border/60 bg-muted/30">
                <CardContent className="p-5 pt-5 flex flex-col justify-between h-full">
                  <span className="text-xs text-muted-foreground font-medium">Open Rate</span>
                  <div className="flex flex-col mt-1">
                    <span className="text-headline-md font-bold text-foreground">{openRate}%</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Unique opens (Benchmark: 32%)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-border/60 bg-muted/30">
                <CardContent className="p-5 pt-5 flex flex-col justify-between h-full">
                  <span className="text-xs text-muted-foreground font-medium">Click Rate</span>
                  <div className="flex flex-col mt-1">
                    <span className="text-headline-md font-bold text-foreground">{clickRate}%</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Unique clicks (Benchmark: 8.5%)</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-border/60 bg-muted/30">
                <CardContent className="p-5 pt-5 flex flex-col justify-between h-full">
                  <span className="text-xs text-muted-foreground font-medium">Unsubscribe Rate</span>
                  <div className="flex flex-col mt-1">
                    <span className="text-headline-md font-bold text-foreground">0.1%</span>
                    <span className="text-xs text-muted-foreground mt-0.5">1 request</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Opens Over Time Chart */}
            <div className="bg-muted/30 border border-border/50 rounded-lg p-lg space-y-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-xs">
                <div className="flex flex-col">
                  <span className="text-title-lg font-bold text-foreground">Opens Over Time (Day 1 – Day 7)</span>
                  <span className="text-xs text-muted-foreground">Daily volume of unique interactions post-dispatch</span>
                </div>
                <Badge variant="outline" className="text-xs">Normalized View</Badge>
              </div>

              {/* Wireframe Bar Chart */}
              <div className="h-40 w-full flex items-end justify-between gap-sm pt-md pb-xs border-b border-border/50">
                {[
                  { day: "Day 1", count: 284, height: "82%", bg: "bg-gradient-to-t from-violet-600 to-violet-400 group-hover:from-violet-500 group-hover:to-violet-300" },
                  { day: "Day 2", count: 142, height: "44%", bg: "bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-500 group-hover:to-purple-300" },
                  { day: "Day 3", count: 76, height: "26%", bg: "bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300" },
                  { day: "Day 4", count: 41, height: "16%", bg: "bg-gradient-to-t from-pink-500 to-rose-400 group-hover:from-pink-400 group-hover:to-rose-300" },
                  { day: "Day 5", count: 25, height: "11%", bg: "bg-gradient-to-t from-fuchsia-500 to-purple-400 group-hover:from-fuchsia-400 group-hover:to-purple-300" },
                  { day: "Day 6", count: 18, height: "8%", bg: "bg-gradient-to-t from-sky-500 to-indigo-400 group-hover:from-sky-400 group-hover:to-indigo-300" },
                  { day: "Day 7", count: 12, height: "5%", bg: "bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-400 group-hover:to-teal-300" },
                ].map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-xs text-muted-foreground mb-1 font-semibold">{item.count}</span>
                    <div
                      className={`w-full ${item.bg} rounded-t transition-all shadow-xs`}
                      style={{ height: item.height }}
                    />
                    <span className="text-xs text-muted-foreground mt-1.5">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Links & Preview Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-sm pt-xs text-xs text-muted-foreground">
              <div className="flex items-center gap-md">
                <Button variant="ghost" size="sm" className="gap-1.5 font-semibold text-foreground">
                  <MousePointerClick className="w-4 h-4" />
                  View Click Map &amp; Links
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="gap-1.5 font-semibold text-foreground"
                >
                  <Eye className="w-4 h-4" />
                  {showEmailPreview ? "Hide Email Content" : "View Email Content"}
                </Button>
              </div>
              <span>Archived delivery snapshot: ID #EM-88219</span>
            </div>

            {showEmailPreview && (
              <StorefrontLivePreview
                channel="Email"
                content={emailContent}
                liveBadgeText="ARCHIVED SNAPSHOT"
                recipientEmail={campaign.targetEmails?.[0] || "customer@example.com"}
              />
            )}
          </div>
        )}

        {/* Web Banner Channel Card */}
        {bannerContent && (
          <div className="w-full bg-card border border-border rounded-xl p-lg shadow-xs space-y-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                  <PanelTop className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-title-lg font-bold text-foreground leading-tight">
                    Web Banner Channel — Runtime Summary
                  </span>
                  <span className="text-xs text-muted-foreground">In-app top announcement ribbon</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                Ended
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
              <div className="bg-muted/30 border border-border/50 rounded-lg p-md flex flex-col justify-between gap-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground font-medium">Lifecycle Duration</span>
                  <span className="text-body-lg font-semibold text-foreground">18 Days Total</span>
                </div>
                <span className="text-xs text-muted-foreground">Ran through scheduled conclusion</span>
              </div>

              <div className="bg-muted/30 border border-border/50 rounded-lg p-md flex flex-col justify-between gap-sm lg:col-span-2">
                <div className="flex items-start gap-sm">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-semibold text-foreground">Channel Scope Note</span>
                    <p className="text-muted-foreground">
                      Channel closed. In-app impressions concluded.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <StorefrontLivePreview
              channel="Banner"
              content={bannerContent}
              liveBadgeText="ARCHIVED SNAPSHOT"
            />
          </div>
        )}

        {/* Modal Popup Channel Card */}
        {popupContent && (
          <div className="w-full bg-card border border-border rounded-xl p-lg shadow-xs space-y-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
                  <AppWindow className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-title-lg font-bold text-foreground leading-tight">
                    Popup Channel — Runtime Summary
                  </span>
                  <span className="text-xs text-muted-foreground">Storefront overlay dialog</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                Ended
              </Badge>
            </div>

            <StorefrontLivePreview
              channel="Popup"
              content={popupContent}
              liveBadgeText="ARCHIVED SNAPSHOT"
            />
          </div>
        )}
      </div>
    </div>
  );
}
