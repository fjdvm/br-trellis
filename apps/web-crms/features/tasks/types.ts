export interface Anomaly {
  anomalyId: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "acknowledged";
  detectedAt: string;
}

export interface TaskItem {
  id: string;
  originalId: string;
  type:
    | "anomaly"
    | "unclaimed_ticket"
    | "unreplied_ticket"
    | "draft_campaign"
    | "new_customer";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  date: string;
  actionLabel: string;
  actionHref?: string;
}
