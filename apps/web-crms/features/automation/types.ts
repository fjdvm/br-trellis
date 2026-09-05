// Automation domain types. WorkflowRunListItem lives in features/ecommerce since
// workflow runs are triggered by ecommerce events; re-export here for stable
// automation-feature import paths.
export type { WorkflowRunListItem } from "@/features/ecommerce/types";
