import { request } from "@/lib/api/request";
import { WorkflowRunListItem } from "@/features/automation/types";

export const workflowRunsApi = {
  list: (entityId?: string) => {
    let url = `/api/v1/workflow-runs`;
    if (entityId) {
      url += `?entityId=${encodeURIComponent(entityId)}`;
    }
    return request<WorkflowRunListItem[]>(url);
  },
};
