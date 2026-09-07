"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  UserPlus,
  Ticket,
  MessageSquareReply,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  ArrowRight,
  ListTodo,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import { conversationTicketsApi } from "@/features/conversations";
import { useCurrentAgentId } from "@/hooks/use-current-agent-id";
import { formatName, formatEmail } from "@/lib/format-display";
import type { TicketListItem } from "@/features/tickets";

interface PersonalTask {
  id: string;
  title: string;
  status: "To Do" | "In Progress" | "Done";
  createdAt: string;
}

const DEFAULT_TASKS: PersonalTask[] = [
  { id: "1", title: "Review high-priority SLA escalations", status: "In Progress", createdAt: new Date().toISOString() },
  { id: "2", title: "Respond to enterprise customer ticket #104", status: "To Do", createdAt: new Date().toISOString() },
  { id: "3", title: "Audit team ticket response times", status: "Done", createdAt: new Date().toISOString() },
];

export function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentAgentId = useCurrentAgentId();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [newCustomerCount, setNewCustomerCount] = useState<number>(24);

  // Personal To-Do State
  const [tasks, setTasks] = useState<PersonalTask[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crms_personal_tasks");
      if (saved) {
        try {
          return JSON.parse(saved) as PersonalTask[];
        } catch {
          // fallback to default
        }
      }
    }
    return DEFAULT_TASKS;
  });
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskFilter, setTaskFilter] = useState<"All" | "To Do" | "In Progress" | "Done">("All");

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("crms_personal_tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const loadDashboardData = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const data = await conversationTicketsApi.list("All", "All", "All");
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets for dashboard", err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Derived KPI metrics
  const myAssignedCount = tickets.filter((t) => {
    if (!currentAgentId) return false;
    return t.assignedToId === currentAgentId || t.assignedToName === session?.user?.name;
  }).length;

  const needsReplyCount = tickets.filter((t) => t.waitingOn === "Agent" && t.status !== "Completed" && t.status !== "Canceled").length;

  const unclaimedCount = tickets.filter((t) => t.status === "Unclaimed").length;

  const urgentTickets = tickets
    .filter((t) => t.status === "Unclaimed" || t.waitingOn === "Agent")
    .slice(0, 5);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task: PersonalTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      status: "To Do",
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTaskTitle("");
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: PersonalTask["status"] =
          t.status === "To Do" ? "In Progress" : t.status === "In Progress" ? "Done" : "To Do";
        return { ...t, status: nextStatus };
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "All") return true;
    return t.status === taskFilter;
  });

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-container-max mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-body-md text-muted-foreground mt-1">
            Overview of customer inquiries, urgent tickets, and your daily tasks.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Card 1: New Customers this week */}
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Customers this week
            </CardTitle>
            <UserPlus className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{newCustomerCount}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
          </CardContent>
        </Card>

        {/* Card 2: My Assigned Tickets */}
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Assigned Tickets
            </CardTitle>
            <Ticket className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{myAssignedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned directly to you</p>
          </CardContent>
        </Card>

        {/* Card 3: Needs a Reply */}
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs a Reply
            </CardTitle>
            <MessageSquareReply className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{needsReplyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting agent response</p>
          </CardContent>
        </Card>

        {/* Card 4: Unclaimed Tickets */}
        <Card className="shadow-none border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unclaimed Tickets
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{unclaimedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">In triage queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Urgent Tickets & Personal Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Urgent Tickets List Section */}
        <div className="lg:col-span-7 space-y-md">
          <Card className="shadow-none border-border h-full flex flex-col">
            <CardHeader className="p-lg pb-sm flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Urgent Tickets
                </CardTitle>
                <CardDescription className="text-body-sm mt-1">
                  High-priority and unclaimed requests requiring immediate attention.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => router.push("/tickets")}
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-lg pt-0 flex-1">
              {isLoadingTickets ? (
                <div className="space-y-sm py-md">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
                  ))}
                </div>
              ) : urgentTickets.length === 0 ? (
                <div className="p-xl text-center text-muted-foreground text-base border border-dashed rounded-lg mt-md">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
                  No urgent or unclaimed tickets at this time.
                </div>
              ) : (
                <ScrollableTable>
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[180px]">Subject</TableHead>
                        <TableHead className="min-w-[140px]">Customer</TableHead>
                        <TableHead className="min-w-[110px]">Status</TableHead>
                        <TableHead className="min-w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {urgentTickets.map((t) => (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/tickets/${t.id}`)}
                        >
                          <TableCell className="font-medium text-base text-foreground">
                            {t.subject || "No Subject"}
                          </TableCell>
                          <TableCell className="text-base text-foreground">
                            {formatName(t.contact?.name || t.contact?.email || "—")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                t.status === "Unclaimed"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              }
                            >
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-medium"
                              onClick={() => router.push(`/tickets/${t.id}`)}
                            >
                              Open
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Tasks (Personal To-Do) Section */}
        <div className="lg:col-span-5 space-y-md">
          <Card className="shadow-none border-border h-full flex flex-col">
            <CardHeader className="p-lg pb-sm">
              <CardTitle className="text-title-lg font-bold flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" />
                My Tasks
              </CardTitle>
              <CardDescription className="text-body-sm mt-1">
                Personal daily to-do items and task tracking.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-lg pt-0 space-y-md flex-1 flex flex-col">
              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-sm">
                <Input
                  placeholder="Add a new personal task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="text-base"
                />
                <Button type="submit" size="sm" className="gap-1 shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </form>

              {/* Status Chips */}
              <div className="flex flex-wrap gap-xs">
                {(["All", "To Do", "In Progress", "Done"] as const).map((st) => (
                  <Badge
                    key={st}
                    variant={taskFilter === st ? "default" : "outline"}
                    className="cursor-pointer py-1 px-3 text-xs font-medium transition-colors"
                    onClick={() => setTaskFilter(st)}
                  >
                    {st}
                  </Badge>
                ))}
              </div>

              {/* Task List */}
              <div className="space-y-sm flex-1 overflow-y-auto max-h-[400px]">
                {filteredTasks.length === 0 ? (
                  <p className="text-base text-muted-foreground text-center py-lg border border-dashed rounded-lg">
                    No tasks found in {taskFilter}.
                  </p>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-sm border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-sm flex-1 min-w-0 pr-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleToggleTaskStatus(task.id)}
                          title="Click to cycle status"
                        >
                          {task.status === "Done" ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : task.status === "In Progress" ? (
                            <Clock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/60" />
                          )}
                        </Button>
                        <span
                          className={`text-base font-medium truncate ${
                            task.status === "Done"
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-xs shrink-0">
                        <Badge
                          variant="outline"
                          className={`cursor-pointer text-xs ${
                            task.status === "Done"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : task.status === "In Progress"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => handleToggleTaskStatus(task.id)}
                        >
                          {task.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "flat";
  icon: any;
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

export function KpiRow({ data, isLoading }: { data: any; isLoading: boolean }) {
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
    activeTickets: 5,
    pendingEscalations: 2,
    unreadConversations: 10,
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
    import("@/features/dashboard").then(({ aiClient }) => {
      aiClient.dashboard.getAnomalies().then((res: any) => {
        setAnomalies(res.anomalies || []);
      });
    });
  }, []);

  const handleAcknowledge = async (id: string) => {
    const { aiClient } = await import("@/features/dashboard");
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

export { DashboardChartSummary, downloadDashboardReport } from "@/features/dashboard/kpi";
