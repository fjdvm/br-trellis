"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { crmClient } from "@/lib/api/crm-client";
import type { CartListItem } from "@/types/ecommerce";

const columns: Column<CartListItem>[] = [
  {
    header: "Cart ID",
    className: "min-w-[130px]",
    cell: (row) => <span className="font-medium">{row.platformCartId}</span>,
  },
  {
    header: "Customer",
    className: "min-w-[160px]",
    cell: (row) => row.contactName ?? row.contactEmail ?? "\u2014",
  },
  {
    header: "Items",
    className: "min-w-[70px]",
    cell: (row) => String(row.itemCount),
  },
  {
    header: "Total",
    className: "min-w-[90px]",
    cell: (row) => `$${row.itemsTotal.toFixed(2)}`,
  },
  {
    header: "Last Activity",
    className: "min-w-[120px]",
    cell: (row) => new Date(row.lastActivityAt).toLocaleDateString(),
  },
  {
    header: "Recovery Status",
    className: "min-w-[160px]",
    cell: (row) =>
      row.workflowRun ? (
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Step {row.workflowRun.currentStepIndex + 1}/{row.workflowRun.totalSteps}
          </span>
          <Badge variant="outline">{row.workflowRun.status}</Badge>
        </span>
      ) : (
        <span className="text-muted-foreground">{"\u2014"}</span>
      ),
  },
];

function searchCarts(cart: CartListItem, query: string): boolean {
  return (
    cart.platformCartId.toLowerCase().includes(query) ||
    (cart.contactName?.toLowerCase().includes(query) ?? false) ||
    (cart.contactEmail?.toLowerCase().includes(query) ?? false)
  );
}

export function AbandonedCartsPage() {
  const [carts, setCarts] = useState<CartListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCarts = useCallback(async () => {
    try {
      const result = await crmClient.ecommerceCarts.list("Abandoned");
      setCarts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load carts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCarts();
  }, [loadCarts]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Abandoned Carts
        </h1>
        <p className="text-body-md text-muted-foreground">
          Carts flagged as abandoned with recovery workflow status.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Abandoned Carts</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : (
            <DataTable
              data={carts}
              columns={columns}
              searchPlaceholder="Search carts&#x2026;"
              searchFn={searchCarts}
              emptyMessage="No abandoned carts found."
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
