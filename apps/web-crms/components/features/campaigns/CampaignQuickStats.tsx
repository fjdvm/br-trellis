"use client";

import { Activity, Users, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CampaignQuickStatsProps {
  activeCount: number;
  recipientsCount: number;
  draftCount: number;
  totalCount: number;
}

export function CampaignQuickStats({
  activeCount,
  recipientsCount,
  draftCount,
  totalCount,
}: CampaignQuickStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
      <Card className="shadow-none border-border">
        <CardContent className="p-md flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-xs">
            <span className="text-sm font-medium">Active Broadcasts</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between mt-sm">
            <span className="text-headline-md font-bold text-foreground">{activeCount}</span>
            <span className="text-sm text-muted-foreground">Across channels</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border">
        <CardContent className="p-md flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-xs">
            <span className="text-sm font-medium">Total Recipients</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between mt-sm">
            <span className="text-headline-md font-bold text-foreground">
              {recipientsCount.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">Verified profiles</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border">
        <CardContent className="p-md flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-xs">
            <span className="text-sm font-medium">Draft Reviews</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-sm">
            <span className="text-headline-md font-bold text-foreground">{draftCount}</span>
            <span className="text-sm text-muted-foreground">Pending signoff</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border">
        <CardContent className="p-md flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-xs">
            <span className="text-sm font-medium">Total Campaigns</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline justify-between mt-sm">
            <span className="text-headline-md font-bold text-foreground">{totalCount}</span>
            <span className="text-sm text-muted-foreground">All lifecycle states</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
