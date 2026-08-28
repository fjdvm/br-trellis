"use client";

import { ShoppingCart, Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EcommerceConnectPrompt() {
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl flex items-center justify-center">
      <Card className="max-w-lg w-full shadow-none border-border">
        <CardContent className="p-xl text-center space-y-lg">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-sm">
            <h2 className="text-title-lg font-bold text-foreground">
              Ecommerce Not Connected
            </h2>
            <p className="text-body-md text-muted-foreground">
              No ecommerce data is available yet. Configure your ecommerce platform
              to send webhook events to this system to start syncing orders, products, carts,
              and customer lifetime value data.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/settings/ecommerce-sync">
              <Link2 className="w-4 h-4 mr-2" />
              View Ecommerce Sync Settings
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
