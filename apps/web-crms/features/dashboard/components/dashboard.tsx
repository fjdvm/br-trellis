"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardHub } from "@/hooks/useDashboardHub";
import { aiClient } from "@/lib/api/ai-client";
import type { LucideIcon } from "lucide-react";

export interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
  icon: LucideIcon;
  isNegativeBad?: boolean;
}

export function KpiCard({ label, value, change, icon: Icon }: KpiCardProps) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{change}</p>
      </CardContent>
    </Card>
  );
}

export interface KpiRowProps {
  data: any;
  isLoading: boolean;
}

export function KpiRow({ data, isLoading }: KpiRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg border border-border animate-pulse bg-muted/20" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="shadow-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Open Support Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.activeTickets?.value}</div>
        </CardContent>
      </Card>
      <Card className="shadow-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg Time to Resolve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">4h 30m</div>
        </CardContent>
      </Card>
      <Card className="shadow-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Customers Leaving (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.churnRate?.value}%</div>
        </CardContent>
      </Card>
      <Card className="shadow-none border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Customer Mood</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Positive 😊</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LiveStatusStrip() {
  const [metrics, setMetrics] = useState({
    activeTickets: 0,
    pendingEscalations: 0,
    unreadConversations: 0,
  });

  useDashboardHub({
    onMetricsUpdated: (data: any) => {
      setMetrics(data);
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-md p-md rounded-lg border border-border bg-card">
      <div>
        <span>Waiting to Be Answered:</span> <strong>{metrics.activeTickets}</strong>
      </div>
      <div>
        <span>Urgent Issues:</span> <strong>{metrics.pendingEscalations}</strong>
      </div>
      <div>
        <span>New Messages:</span> <strong>{metrics.unreadConversations}</strong>
      </div>
      <div>Live System Status: Optimal</div>
    </div>
  );
}

export function AttentionFeed() {
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    aiClient.dashboard.getAnomalies().then((res: any) => {
      setAnomalies(res.anomalies || []);
    });
  }, []);

  const handleAcknowledge = async (id: string) => {
    await aiClient.dashboard.acknowledgeAnomaly(id);
  };

  if (anomalies.length === 0) {
    return <div>All Clear</div>;
  }

  return (
    <div className="space-y-sm">
      {anomalies.map((anom) => (
        <div key={anom.anomalyId} className="flex items-center justify-between p-sm border border-border rounded-md">
          <span>{anom.description}</span>
          <Button variant="outline" size="sm" onClick={() => handleAcknowledge(anom.anomalyId)}>
            Acknowledge
          </Button>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  return <div className="p-xl text-muted-foreground">Dashboard — coming soon.</div>;
}

export { DashboardChartSummary, downloadDashboardReport } from "./dashboard-chart-summary";

