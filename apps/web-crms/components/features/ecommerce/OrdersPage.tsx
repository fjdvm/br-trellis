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
import type { OrderListItem } from "@/types/ecommerce";

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const result = await crmClient.ecommerceOrders.list();
      setOrders(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Orders
        </h1>
        <p className="text-body-md text-muted-foreground">
          View and manage ecommerce orders.
        </p>
      </div>

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">All Orders</CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-xl text-muted-foreground">No orders found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Refund</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.platformOrderId}
                    </TableCell>
                    <TableCell>
                      {order.contactName ?? order.contactEmail ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "Refunded"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      {order.refundedAmount > 0
                        ? `$${order.refundedAmount.toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.lineItemCount}</TableCell>
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
