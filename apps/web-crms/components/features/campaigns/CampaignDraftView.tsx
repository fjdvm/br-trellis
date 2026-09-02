"use client";

import { CheckCircle2, Mail, PanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Campaign } from "@/types/campaign";

interface CampaignDraftViewProps {
  campaign: Campaign;
  recipientCount: number;
  segmentName: string | null;
  onLaunch: () => void;
  busy: boolean;
}

export function CampaignDraftView({
  campaign,
  recipientCount,
  segmentName,
  onLaunch,
  busy,
}: CampaignDraftViewProps) {
  const emailContent = campaign.channelContents.find((c) => c.channel === "Email");
  const bannerContent = campaign.channelContents.find((c) => c.channel === "Banner");

  return (
    <div className="space-y-8">
      {/* Top Metadata / Audience Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md bg-card border border-border p-lg rounded-xl shadow-xs">
        <div className="flex flex-col gap-xs">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Audience Segment
          </span>
          <p className="text-title-lg font-bold text-foreground truncate">
            {segmentName ?? "No segment"}
          </p>
          <span className="text-xs text-muted-foreground">
            {recipientCount} contacts targeted
          </span>
          {campaign.targetEmails && campaign.targetEmails.length > 0 && (
            <span className="text-xs text-muted-foreground truncate">
              {campaign.targetEmails.join(", ")}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-xs md:border-l md:border-border md:pl-md">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Total Recipients
          </span>
          <div className="flex items-baseline gap-xs">
            <p className="text-display-lg font-bold text-foreground">{recipientCount}</p>
            <span className="text-xs text-muted-foreground">verified contacts</span>
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-xs">
            <div className="bg-primary h-full rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="flex flex-col gap-xs md:border-l md:border-border md:pl-md">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Created Details
          </span>
          <p className="text-base font-semibold text-foreground">
            {new Date(campaign.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <span className="text-xs text-muted-foreground">Jane Doe (Growth Ops)</span>
        </div>

        <div className="flex flex-col gap-xs md:border-l md:border-border md:pl-md">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Last Activity
          </span>
          <p className="text-base font-semibold text-foreground">Unpublished state</p>
          <span className="text-xs text-muted-foreground">Modified by author</span>
        </div>
      </div>

      {/* Configured Distribution Channels */}
      <div className="space-y-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <h2 className="text-headline-sm font-bold text-foreground">Configured Distribution Channels</h2>
            <Badge variant="secondary">{campaign.channels.length} active</Badge>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Review all drafts prior to stage deployment
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg items-start">
          {/* Email Channel Card */}
          {emailContent && (
            <div className="bg-card border border-border rounded-xl p-lg shadow-xs flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-title-lg font-bold text-foreground">Email Channel</h3>
                    <p className="text-xs text-muted-foreground">Template: Product Announcement v2</p>
                  </div>
                </div>
                <Badge variant="outline" className="uppercase text-[10px]">
                  Pending Launch
                </Badge>
              </div>

              <div className="flex flex-col gap-sm bg-muted/30 p-md rounded-lg text-base">
                <div>
                  <span className="text-xs text-muted-foreground block">Subject Line</span>
                  <p className="font-semibold text-foreground">
                    {emailContent.subject || "No subject set"}
                  </p>
                </div>
                {emailContent.body && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Body Copy</span>
                    <p className="text-muted-foreground line-clamp-2">{emailContent.body}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Web Banner Channel Card */}
          {bannerContent && (
            <div className="bg-card border border-border rounded-xl p-lg shadow-xs flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
                    <PanelTop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-title-lg font-bold text-foreground">Web Banner Channel</h3>
                    <p className="text-xs text-muted-foreground">Header notification across portal</p>
                  </div>
                </div>
                <Badge variant="outline" className="uppercase text-[10px]">
                  Pending Launch
                </Badge>
              </div>

              <div className="flex flex-col gap-sm bg-muted/30 p-md rounded-lg text-base">
                <div>
                  <span className="text-xs text-muted-foreground block">Message Copy</span>
                  <p className="font-semibold text-foreground">
                    {bannerContent.body || "No message copy set"}
                  </p>
                </div>
                {bannerContent.linkUrl && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Target Link</span>
                    <p className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded inline-block">
                      {bannerContent.linkUrl}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pre-Flight Checklist Banner */}
      <div className="bg-card border border-border rounded-xl p-lg shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0">
            <CheckCircle2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-title-lg font-bold text-foreground">Pre-Flight Checklist Completed</span>
            <span className="text-xs text-muted-foreground">
              All sender domains validated, unsub links resolved, audience criteria satisfied.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Button variant="outline" size="sm">
            Send Test Run
          </Button>
          <Button onClick={onLaunch} disabled={busy} size="sm" className="shadow-sm">
            {busy ? "Executing…" : "Start Dispatch"}
          </Button>
        </div>
      </div>
    </div>
  );
}
