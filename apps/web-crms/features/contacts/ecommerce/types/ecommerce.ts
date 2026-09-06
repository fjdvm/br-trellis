export interface OrderListItem {
  id: string;
  platformOrderId: string;
  contactId: string;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  total: number;
  refundedAmount: number;
  createdAt: string;
  lineItemCount: number;
}

export interface ProductListItem {
  id: string;
  platformProductId: string;
  name: string;
  price: number;
  inStock: boolean;
  updatedAt: string;
}

export interface WorkflowRunSummary {
  id: string;
  workflowName: string;
  currentStepIndex: number;
  totalSteps: number;
  status: string;
  nextStepDueAt: string;
}

export interface CartListItem {
  id: string;
  platformCartId: string;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  itemCount: number;
  itemsTotal: number;
  lastActivityAt: string;
  workflowRun: WorkflowRunSummary | null;
}

export interface WorkflowRunListItem {
  id: string;
  workflowId: string;
  workflowName: string;
  entityId: string;
  entityType: string;
  entityLabel: string | null;
  currentStepIndex: number;
  totalSteps: number;
  status: string;
  startedAt: string;
  nextStepDueAt: string;
  completedAt: string | null;
}

export type EcommerceSyncStatusState = "never_connected" | "healthy" | "stale";

export interface EcommerceSyncStatus {
  status: EcommerceSyncStatusState;
  firstEventReceivedAt: string | null;
  lastEventReceivedAt: string | null;
  webhookSecretConfigured: boolean;
  maskedWebhookSecret: string | null;
}
