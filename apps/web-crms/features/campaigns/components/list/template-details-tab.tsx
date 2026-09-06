import React from "react";
import { Badge } from "@/components/ui/badge";

export function TemplateDetailsTab() {
  return (
    <div className="space-y-4 text-left">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recipients</span>
          <span className="text-headline-sm font-bold text-foreground mt-1">1 contact</span>
        </div>
        <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dispatched</span>
          <span className="text-headline-sm font-bold text-foreground mt-1">1 sent</span>
        </div>
        <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Open Rate</span>
          <span className="text-headline-sm font-bold text-foreground mt-1">0%</span>
        </div>
        <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Click Rate</span>
          <span className="text-headline-sm font-bold text-foreground mt-1">0%</span>
        </div>
      </div>

      {/* Hourly Engagement Rate Graph Chart Below Stat Cards */}
      <div className="bg-card border border-border rounded-xl p-md space-y-sm shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground">Hourly Engagement Rate</h4>
            <p className="text-xs text-muted-foreground">Aggregate clicks &amp; conversions during launch window</p>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            +18.4% vs benchmark
          </Badge>
        </div>

        {/* Bar Chart Wireframe */}
        <div className="h-32 w-full flex items-end justify-between gap-sm pt-md pb-xs border-b border-border/50">
          {[
            { day: "Hour 1", count: 1, height: "100%", bg: "bg-gradient-to-t from-violet-600 to-violet-400 group-hover:from-violet-500 group-hover:to-violet-300" },
            { day: "Hour 2", count: 0, height: "6px", bg: "bg-gradient-to-t from-purple-500/50 to-purple-400/30" },
            { day: "Hour 3", count: 0, height: "6px", bg: "bg-gradient-to-t from-indigo-500/50 to-indigo-400/30" },
            { day: "Hour 4", count: 0, height: "6px", bg: "bg-gradient-to-t from-pink-500/50 to-pink-400/30" },
            { day: "Hour 5", count: 0, height: "6px", bg: "bg-gradient-to-t from-fuchsia-500/50 to-fuchsia-400/30" },
            { day: "Hour 6", count: 0, height: "6px", bg: "bg-gradient-to-t from-sky-500/50 to-sky-400/30" },
            { day: "Hour 7", count: 0, height: "6px", bg: "bg-gradient-to-t from-emerald-500/50 to-emerald-400/30" },
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

      {/* Two Column Grid for Dispatch Result & Engagement Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {/* Dispatch Result Container */}
        <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-sm">
          <h4 className="text-sm font-bold text-foreground">Dispatch Result</h4>
          <div className="flex flex-col space-y-1.5 text-base">
            <div>
              <span className="text-muted-foreground">Recipients: </span>
              <span className="font-semibold text-foreground">1</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sent: </span>
              <span className="font-semibold text-foreground">1</span>
            </div>
            <div>
              <span className="text-muted-foreground">Failed: </span>
              <span className="font-semibold text-foreground">0</span>
            </div>
          </div>
        </div>

        {/* Engagement Analytics Container */}
        <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-sm">
          <h4 className="text-sm font-bold text-foreground">Engagement Analytics</h4>
          <div className="grid grid-cols-2 gap-2 text-base">
            <div>
              <span className="text-muted-foreground block text-xs">Open Rate</span>
              <span className="font-semibold text-foreground text-base">0%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Click Rate</span>
              <span className="font-semibold text-foreground text-base">0%</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Opened</span>
              <span className="font-semibold text-foreground text-base">0</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Clicked</span>
              <span className="font-semibold text-foreground text-base">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
