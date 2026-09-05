import { useState, useCallback } from "react";
import { aiClient } from "@/lib/api/ai-client";
import { crmClient } from "@/lib/api/crm-client";
// Use the legacy TicketListItem that matches the PaginatedTicketResponse returned by ticketsApi.list()
import type { TicketListItem } from "@/features/conversations/types/ticket";
import type { Anomaly, TaskItem } from "../types";

const SEVERITY_SCORE: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

interface DraftCampaign {
  id: string;
  title: string;
  createdAt: string;
}

interface CustomerItem {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
}

interface PaginatedCustomers {
  items?: CustomerItem[];
}

function normalizeTasks(
  anomaliesRes: { anomalies?: Anomaly[] },
  allTickets: TicketListItem[],
  draftCampaigns: DraftCampaign[],
  customers: CustomerItem[]
): TaskItem[] {
  const tasks: TaskItem[] = [];

  // Anomalies
  const openAnomalies = (anomaliesRes.anomalies ?? []).filter(
    (a) => a.status !== "resolved" && a.status !== "acknowledged"
  );
  for (const a of openAnomalies) {
    tasks.push({
      id: `anomaly-${a.anomalyId}`,
      originalId: a.anomalyId,
      type: "anomaly",
      title: "System Anomaly",
      description: a.description,
      severity: a.severity,
      date: a.detectedAt,
      actionLabel: "Acknowledge",
    });
  }

  // Unclaimed Tickets
  for (const t of allTickets.filter((t) => t.status === "Unclaimed")) {
    tasks.push({
      id: `unclaimed-${t.id}`,
      originalId: t.id,
      type: "unclaimed_ticket",
      title: "Unclaimed Ticket",
      description: t.title,
      severity: "high",
      date: t.createdAt,
      actionLabel: "Claim",
    });
  }

  // Unreplied Messages
  for (const t of allTickets.filter(
    (t) =>
      (t.status === "Claimed" || t.status === "Ongoing") &&
      t.unreadMessageCount != null &&
      t.unreadMessageCount > 0
  )) {
    tasks.push({
      id: `unreplied-${t.id}`,
      originalId: t.id,
      type: "unreplied_ticket",
      title: "Unreplied Message",
      description: `Ticket: ${t.title} (${t.unreadMessageCount} unread)`,
      severity: "medium",
      date: (t.lastMessageAt ?? t.updatedAt ?? t.createdAt) as string,
      actionLabel: "Reply",
      actionHref: `/conversations/inbox/${t.id}`,
    });
  }

  // Draft Campaigns
  for (const c of draftCampaigns) {
    tasks.push({
      id: `campaign-${c.id}`,
      originalId: c.id,
      type: "draft_campaign",
      title: "Draft Campaign",
      description: c.title,
      severity: "low",
      date: c.createdAt,
      actionLabel: "Review",
      actionHref: `/campaigns/${c.id}`,
    });
  }

  // New Customers (last 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  for (const c of customers.filter(
    (c) => new Date(c.createdAt) >= threeDaysAgo
  )) {
    tasks.push({
      id: `customer-${c.id}`,
      originalId: c.id,
      type: "new_customer",
      title: "New Customer Sign Up",
      description: `${c.displayName} (${c.email})`,
      severity: "low",
      date: c.createdAt,
      actionLabel: "View Profile",
      actionHref: `/customers/${c.id}`,
    });
  }

  tasks.sort((a, b) => {
    const scoreA = SEVERITY_SCORE[a.severity] ?? 0;
    const scoreB = SEVERITY_SCORE[b.severity] ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return tasks;
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const [anomaliesRes, ticketsRes, draftCampaignsRes, customersRes] =
        await Promise.all([
          aiClient.dashboard
            .getAnomalies()
            .catch(() => ({ anomalies: [] as Anomaly[] })),
          crmClient.tickets
            .list(1, 100)
            .catch(() => ({ items: [] as TicketListItem[] })),
          crmClient.campaigns
            .list("Draft")
            .catch(() => [] as DraftCampaign[]),
          crmClient.customers
            .list(1, 20)
            .catch(() => ({ items: [] as CustomerItem[] })),
        ]);

      setTasks(
        normalizeTasks(
          anomaliesRes,
          ticketsRes.items ?? [],
          (draftCampaignsRes as DraftCampaign[]) ?? [],
          ((customersRes as PaginatedCustomers).items ?? [])
        )
      );
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tasks, isLoading, fetchTasks };
}
