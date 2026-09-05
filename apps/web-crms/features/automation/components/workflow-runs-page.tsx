"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { workflowRunsApi } from "@/features/automation/services/workflow-runs-api";
import type { WorkflowRunListItem } from "@/features/ecommerce/types";

function getStatusVariant(status: string): "default" | "outline" | "destructive" {
  switch (status) {
    case "Completed":
      return "outline";
    case "Stopped":
      return "destructive";
    default:
      return "default";
  }
}

const columns: Column<WorkflowRunListItem>[] = [
  {
    header: "Workflow",
    cell: (row) => <span className="font-medium">{row.workflowName}</span>,
  },
  {
    header: "Entity",
    cell: (row) => row.entityLabel ?? `${row.entityType} ${row.entityId.slice(0, 8)}`,
  },
  {
    header: "Step Progress",
    cell: (row) => `${row.currentStepIndex + 1} / ${row.totalSteps}`,
  },
  {
    header: "Status",
    cell: (row) => (
      <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
    ),
  },
  {
    header: "Started",
    cell: (row) => new Date(row.startedAt).toLocaleDateString(),
  },
  {
    header: "Next Due",
    cell: (row) =>
      row.nextStepDueAt ? new Date(row.nextStepDueAt).toLocaleDateString() : "\u2014",
  },
  {
    header: "Completed",
    cell: (row) =>
      row.completedAt ? new Date(row.completedAt).toLocaleDateString() : "\u2014",
  },
];

function searchRuns(run: WorkflowRunListItem, query: string): boolean {
  return (
    run.workflowName.toLowerCase().includes(query) ||
    (run.entityLabel?.toLowerCase().includes(query) ?? false) ||
    run.status.toLowerCase().includes(query)
  );
}

export function WorkflowRunsPage() {
  const [runs, setRuns] = useState<WorkflowRunListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      const result = await workflowRunsApi.list();
      setRuns(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load runs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Workflow Runs
        </h1>
        <p className="text-body-md text-muted-foreground">
          Monitor active and completed workflow executions.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">All Runs</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : (
            <DataTable
              data={runs}
              columns={columns}
              searchPlaceholder="Search workflow runs&#x2026;"
              searchFn={searchRuns}
              emptyMessage="No workflow runs found."
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
