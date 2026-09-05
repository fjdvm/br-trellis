import { useState, useCallback } from "react";
import { aiClient } from "@/features/dashboard/services/ai-client";
import { ticketsApi } from "@/features/conversations/services/conversations-api";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";
import { customerApi } from "@/features/customers/services/customers-api";
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
  name: string;
  updatedAt: string;
}

interface CustomerItem {
  id: string;
  name: string;
  churnScore?: number;
  riskLevel?: string;
  recommendedAction?: string;
}

export function normalizeTasks(
  anomaliesRes: { anomalies?: Anomaly[] },
  tickets: TicketListItem[],
  campaigns: DraftCampaign[],
  customers: CustomerItem[]
): TaskItem[] {
  const tasks: TaskItem[] = [];

  // Anomaly tasks
  (anomaliesRes.anomalies ?? []).forEach((anomaly) => {
    if (!anomaly.acknowledged) {
      tasks.push({
        id: `anomaly-${anomaly.id}`,
        type: "anomaly",
        title: anomaly.title || anomaly.metric || "Anomaly Detected",
        description: anomaly.description || `Anomaly in ${anomaly.metric}`,
        severity: anomaly.severity || "medium",
        source: anomaly.source || "System",
        actionable: true,
        actionType: "acknowledge_anomaly",
        originalData: anomaly,
      });
    }
  });

  // Ticket tasks
  tickets.forEach((ticket) => {
    if (ticket.status === "Unclaimed") {
      const isHigh =
        ticket.priority?.toLowerCase() === "high" ||
        ticket.priority?.toLowerCase() === "urgent";

      tasks.push({
        id: `ticket-${ticket.id}`,
        type: "unclaimed_ticket",
        title: `Unclaimed Ticket: ${ticket.subject || ticket.title}`,
        description: ticket.description || "Customer waiting for response",
        severity: isHigh ? "high" : "medium",
        source: "Support",
        actionable: true,
        actionType: "claim_ticket",
        originalData: ticket,
      });
    }
  });

  // Campaign draft tasks
  campaigns.forEach((campaign) => {
    tasks.push({
      id: `campaign-${campaign.id}`,
      type: "draft_campaign",
      title: `Draft Campaign: ${campaign.name}`,
      description: "Campaign waiting for review/launch",
      severity: "low",
      source: "Marketing",
      actionable: true,
      actionType: "review_campaign",
      originalData: campaign,
    });
  });

  // Customer retention tasks
  customers.forEach((customer) => {
    if (
      customer.riskLevel === "High" ||
      customer.riskLevel === "Critical" ||
      (customer.churnScore && customer.churnScore > 0.7)
    ) {
      tasks.push({
        id: `customer-${customer.id}`,
        type: "at_risk_customer",
        title: `At-Risk Customer: ${customer.name}`,
        description:
          customer.recommendedAction ||
          `High churn risk (${Math.round((customer.churnScore || 0) * 100)}%)`,
        severity: customer.riskLevel === "Critical" ? "critical" : "high",
        source: "Retention",
        actionable: true,
        actionType: "contact_customer",
        originalData: customer,
      });
    }
  });

  return tasks.sort((a, b) => {
    const scoreA = SEVERITY_SCORE[a.severity] || 0;
    const scoreB = SEVERITY_SCORE[b.severity] || 0;
    return scoreB - scoreA;
  });
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
          ticketsApi
            .list(1, 100)
            .catch(() => ({ items: [] as TicketListItem[] })),
          campaignsApi
            .list("Draft")
            .catch(() => [] as DraftCampaign[]),
          customerApi
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
