export interface Anomaly {
  id?: string;
  anomalyId?: string;
  title?: string;
  metric?: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status?: "open" | "investigating" | "resolved" | "acknowledged";
  acknowledged?: boolean;
  source?: string;
  detectedAt?: string;
}

export interface TaskItem {
  id: string;
  originalId?: string;
  type:
    | "anomaly"
    | "unclaimed_ticket"
    | "unreplied_ticket"
    | "draft_campaign"
    | "new_customer"
    | "at_risk_customer";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  date?: string;
  source?: string;
  actionable?: boolean;
  actionType?: string;
  actionLabel?: string;
  actionHref?: string;
  originalData?: any;
}
