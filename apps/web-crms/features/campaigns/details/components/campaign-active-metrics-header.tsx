import React from "react";
import { Users, Send, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignActiveMetricsHeaderProps {
  segmentName: string | null;
  recipientCount: number;
  dispatchedCount: number;
  deliveryRate: string;
}

export function CampaignActiveMetricsHeader({
  segmentName,
  recipientCount,
  dispatchedCount,
  deliveryRate,
}: CampaignActiveMetricsHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
      <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-xs">
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

      <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-xs">
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

      <div className="bg-card border border-border rounded-xl p-lg shadow-xs space-y-xs">
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
  );
}
