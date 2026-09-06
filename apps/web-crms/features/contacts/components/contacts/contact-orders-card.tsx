"use client";

import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContactDetail } from "@/features/contacts/types";

interface ContactOrdersCardProps {
  orders: ContactDetail["orders"];
}

export function ContactOrdersCard({ orders }: ContactOrdersCardProps) {
  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold">Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mb-md" />
            <p className="text-base text-muted-foreground">
              No orders yet. Order data synced from the ecommerce platform will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-md">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-md space-y-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <span className="font-medium text-base">#{order.platformOrderId}</span>
                    <Badge variant={order.status === "Refunded" ? "destructive" : "outline"}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-base text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-base">
                  <span className="font-medium">${order.total.toFixed(2)}</span>
                  {order.refundedAmount > 0 && (
                    <span className="text-destructive ml-2">
                      (−${order.refundedAmount.toFixed(2)} refunded)
                    </span>
                  )}
                </div>
                {order.lineItems.length > 0 && (
                  <div className="text-sm text-muted-foreground space-y-xs">
                    {order.lineItems.map((item, idx) => (
                      <div key={idx}>
                        {item.quantity}× {item.productName} @ ${item.unitPrice.toFixed(2)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
