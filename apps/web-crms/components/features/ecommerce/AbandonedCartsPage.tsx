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
import type { CartListItem } from "@/types/ecommerce";

export function AbandonedCartsPage() {
  const [carts, setCarts] = useState<CartListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCarts = useCallback(async () => {
    try {
      const result = await crmClient.ecommerceCarts.list("Abandoned");
      setCarts(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load abandoned carts."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCarts();
  }, [loadCarts]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Abandoned Carts
        </h1>
        <p className="text-body-md text-muted-foreground">
          View abandoned carts and their recovery workflow status.
        </p>
      </div>

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">
            Abandoned Carts
          </CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : carts.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No abandoned carts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cart ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Recovery Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell className="font-medium">
                      {cart.platformCartId}
                    </TableCell>
                    <TableCell>
                      {cart.contactName ?? cart.contactEmail ?? "—"}
                    </TableCell>
                    <TableCell>{cart.itemCount}</TableCell>
                    <TableCell>${cart.itemsTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(cart.lastActivityAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {cart.workflowRun ? (
                        <span className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Step {cart.workflowRun.currentStepIndex + 1}/
                            {cart.workflowRun.totalSteps}
                          </span>
                          <Badge variant="outline">
                            {cart.workflowRun.status}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
