import React from "react";
import { Badge } from "@/components/ui/badge";

export function CampaignActiveSparkline() {
  return (
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
  );
}
