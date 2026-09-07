"use client";

import { useState } from "react";

export interface DashboardMetrics {
  activeTickets: number;
  pendingEscalations: number;
  unreadConversations: number;
  onlineAgents: number;
}

interface UseDashboardHubOptions {
  onMetricsUpdated?: (metrics: DashboardMetrics) => void;
}

export function useDashboardHub(_options: UseDashboardHubOptions = {}) {
  const [isConnected] = useState(false);
  return { isConnected };
}
