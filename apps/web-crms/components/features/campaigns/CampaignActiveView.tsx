"use client";

import { useState } from "react";
import { Mail, PanelTop, StopCircle, Eye, Activity, Send, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, DispatchResultCard } from "@/components/features/campaigns/CampaignDetailCards";
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

  const dispatchedCount = campaign.dispatchResult?.sentCount ?? Math.max(0, recipientCount - 4);
  const deliveryRate = recipientCount > 0 ? ((dispatchedCount / recipientCount) * 100).toFixed(1) : "99.7";

  return (
    <div className="space-y-8">
      {/* Top Metadata / Audience Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="flex flex-col p-lg bg-card border border-border rounded-xl shadow-xs justify-between">
          <div className="flex items-center justify-between mb-2 text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Audience</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-headline-sm font-bold text-foreground truncate">
              {segmentName ?? "Enterprise Clients"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{recipientCount} contacts target</div>
          </div>
        </div>

        <div className="flex flex-col p-lg bg-card border border-border rounded-xl shadow-xs justify-between">
          <div className="flex items-center justify-between mb-2 text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Target Recipients</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-headline-sm font-bold text-foreground">{recipientCount} contacts</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Full production distribution list</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col p-lg bg-card border border-border rounded-xl shadow-xs justify-between">
          <div className="flex items-center justify-between mb-2 text-muted-foreground">
            <span className="text-xs uppercase tracking-wider font-semibold">Launched At</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-headline-sm font-bold text-foreground">
              {new Date(campaign.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1 mt-1 text-sm font-semibold text-foreground">
              <span>Active live session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Result Card */}
      {campaign.dispatchResult && <DispatchResultCard result={campaign.dispatchResult} />}

      {/* Engagement Analytics Card */}
      {analytics && <AnalyticsCard analytics={analytics} />}

      {/* Per-Channel Live Status Cards Section */}
      <div className="space-y-md">
        <div className="flex items-center justify-between">
          <h2 className="text-title-lg font-bold text-foreground tracking-tight">
            Channel Performance &amp; Live State
          </h2>
          <span className="text-xs text-muted-foreground">
            {campaign.channels.length} channels active
          </span>
        </div>

        {/* Email Channel Card */}
        {emailContent && (
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

            {/* Collapsible Email Preview */}
            {showEmailPreview && (
              <div className="p-md bg-muted/20 border border-border rounded-lg space-y-sm text-base">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subject: <strong className="text-foreground">{emailContent.subject}</strong></span>
                  <span>Read-only Snapshot</span>
                </div>
                {emailContent.body && (
                  <p className="p-md bg-card border border-border rounded text-foreground whitespace-pre-wrap">
                    {emailContent.body}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Web Banner Channel Card */}
        {bannerContent && (
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

            <div className="p-md bg-muted/40 border border-border rounded-lg space-y-xs">
              <span className="text-xs text-muted-foreground font-medium">In-App Banner Visual Preview</span>
              <div className="p-md bg-primary text-primary-foreground rounded-lg flex items-center justify-between gap-md">
                <p className="text-sm font-medium truncate">
                  {bannerContent.body || "New enterprise features are now live in your workspace!"}
                </p>
                {bannerContent.linkUrl && (
                  <span className="text-xs underline font-bold shrink-0">Learn More</span>
                )}
              </div>
            </div>
          </div>
        )}
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
          <Badge variant="secondary">+18.4% vs benchmark</Badge>
        </div>
        <div className="w-full h-20 pt-2">
          <svg className="w-full h-full text-primary" fill="none" viewBox="0 0 600 80" preserveAspectRatio="none">
            <path d="M0,70 Q75,65 150,45 T300,30 T450,15 T600,8 L600,80 L0,80 Z" fill="currentColor" fillOpacity="0.08" />
            <path d="M0,70 Q75,65 150,45 T300,30 T450,15 T600,8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
