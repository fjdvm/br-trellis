"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { crmClient } from "@/lib/api/crm-client";
import { useEcommerceSyncStatus } from "@/hooks/useEcommerceSyncStatus";
import { EcommerceConnectPrompt } from "./EcommerceConnectPrompt";
import type { OrderListItem } from "@/types/ecommerce";

const columns: Column<OrderListItem>[] = [
  {
    header: "Order ID",
    className: "min-w-[140px]",
    cell: (row) => <span className="font-medium">{row.platformOrderId}</span>,
  },
  {
    header: "Customer",
    className: "min-w-[160px]",
    cell: (row) => row.contactName ?? row.contactEmail ?? "\u2014",
  },
  {
    header: "Status",
    className: "min-w-[100px]",
    cell: (row) => (
      <Badge variant={row.status === "Refunded" ? "destructive" : "outline"}>
        {row.status}
      </Badge>
    ),
  },
  {
    header: "Total",
    className: "min-w-[90px]",
    cell: (row) => `$${row.total.toFixed(2)}`,
  },
  {
    header: "Refund",
    className: "min-w-[90px]",
    cell: (row) =>
      row.refundedAmount > 0 ? `$${row.refundedAmount.toFixed(2)}` : "\u2014",
  },
  {
    header: "Date",
    className: "min-w-[110px]",
    cell: (row) => new Date(row.createdAt).toLocaleDateString(),
  },
  {
    header: "Items",
    className: "min-w-[70px]",
    cell: (row) => String(row.lineItemCount),
  },
];

function searchOrders(order: OrderListItem, query: string): boolean {
  return (
    order.platformOrderId.toLowerCase().includes(query) ||
    (order.contactName?.toLowerCase().includes(query) ?? false) ||
    (order.contactEmail?.toLowerCase().includes(query) ?? false) ||
    order.status.toLowerCase().includes(query)
  );
}

export function OrdersPage() {
  const { status: syncState, isLoading: syncLoading } = useEcommerceSyncStatus();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const result = await crmClient.ecommerceOrders.list();
      setOrders(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (!syncLoading && syncState === "never_connected") {
    return <EcommerceConnectPrompt />;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Orders
        </h1>
        <p className="text-body-md text-muted-foreground">
          View ecommerce orders synced from the platform.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">All Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={7} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : (
            <DataTable
              data={orders}
              columns={columns}
              searchPlaceholder="Search orders&#x2026;"
              searchFn={searchOrders}
              emptyMessage="No orders found."
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
