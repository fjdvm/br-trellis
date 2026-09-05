"use client";

import React, { useEffect } from "react";
import { aiClient } from "@/features/dashboard/services/ai-client";
import { ticketsApi } from "@/features/conversations/services/conversations-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShieldAlert,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { formatTimeAgo, getSeverityBadgeClass } from "@/lib/tasks-helpers";
import { useTasks } from "../hooks/use-tasks";

export function TasksPage() {
  const { tasks, isLoading, fetchTasks } = useTasks();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAcknowledgeAnomaly = async (id: string) => {
    try {
      await aiClient.dashboard.acknowledgeAnomaly(id);
      toast.success("Anomaly acknowledged.");
      fetchTasks();
    } catch (err) {
      toast.error(
        `Failed to acknowledge: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  };

  const handleClaimTicket = async (id: string) => {
    try {
      await ticketsApi.claim(id);
      toast.success("Ticket claimed successfully.");
      fetchTasks();
    } catch (err) {
      toast.error(
        `Failed to claim ticket: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  };

  const handleAction = (task: ReturnType<typeof useTasks>["tasks"][number]) => {
    if (!task.originalId) return;
    if (task.type === "anomaly") {
      handleAcknowledgeAnomaly(task.originalId);
    } else if (task.type === "unclaimed_ticket") {
      handleClaimTicket(task.originalId);
    }
  };

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Tasks &amp; Attention
          </h1>
          <p className="text-body-md text-muted-foreground">
            A unified feed of items requiring your attention
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="bg-card border-border shadow-none flex flex-col">
          <CardContent className="py-md pt-0 space-y-md">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border shadow-none flex flex-col">
          <CardHeader className="pb-md p-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
            <div className="flex items-center gap-sm">
              <ShieldAlert className="w-5 h-5 text-warning" />
              <CardTitle className="text-title-lg font-bold text-foreground">
                Action Items
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-md pt-0 space-y-md">
            {tasks.length === 0 ? (
              <div className="flex flex-row items-center justify-center py-xl text-left gap-md">
                <CheckCircle2 className="w-10 h-10 text-success shrink-0" />
                <div className="flex flex-col text-left">
                  <div className="text-body-lg font-semibold text-foreground">
                    All Clear
                  </div>
                  <p className="text-body-md text-muted-foreground">
                    No active anomalies, open tickets, or capacity alerts
                    detected at this time.
                  </p>
                </div>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-md border border-border/80 rounded-xl p-md bg-muted/20 hover:bg-muted/40 transition-all duration-300 animate-in fade-in duration-300"
                >
                  <div className="space-y-xs flex-1">
                    <div className="flex items-center gap-sm flex-wrap">
                      <Badge
                        variant="outline"
                        className={getSeverityBadgeClass(task.severity)}
                      >
                        {task.title.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {formatTimeAgo(task.date || "")}
                      </span>
                    </div>
                    <p className="text-body-sm font-medium text-foreground">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    {task.actionHref ? (
                      <Link href={task.actionHref} passHref>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-xs border-border/80 text-body-sm bg-background hover:bg-muted duration-300 font-medium"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {task.actionLabel}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-xs border-border/80 text-body-sm bg-background hover:bg-muted duration-300 font-medium"
                        onClick={() => handleAction(task)}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {task.actionLabel}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
