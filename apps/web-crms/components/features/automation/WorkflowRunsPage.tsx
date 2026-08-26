"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crmClient } from "@/lib/api/crm-client";
import type { WorkflowRunListItem } from "@/types/ecommerce";

function getStatusVariant(
  status: string
): "default" | "outline" | "destructive" {
  switch (status) {
    case "Completed":
      return "outline";
    case "Stopped":
      return "destructive";
    default:
      return "default";
  }
}

export function WorkflowRunsPage() {
  const [runs, setRuns] = useState<WorkflowRunListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      const result = await crmClient.workflowRuns.list();
      setRuns(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load workflow runs."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Workflow Runs
        </h1>
        <p className="text-body-md text-muted-foreground">
          Monitor active and completed workflow executions.
        </p>
      </div>

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">
            All Workflow Runs
          </CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : runs.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No workflow runs found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Step Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      {run.workflowName}
                    </TableCell>
                    <TableCell>
                      {run.entityLabel ??
                        `${run.entityType} ${run.entityId}`}
                    </TableCell>
                    <TableCell>
                      {run.currentStepIndex + 1} / {run.totalSteps}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(run.status)}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(run.startedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {run.nextStepDueAt
                        ? new Date(run.nextStepDueAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {run.completedAt
                        ? new Date(run.completedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
