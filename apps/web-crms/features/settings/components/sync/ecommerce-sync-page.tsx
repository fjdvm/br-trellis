"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ecommerceSyncStatusApi } from "@/features/ecommerce/services/ecommerce-api";
import type { EcommerceSyncStatus } from "@/features/ecommerce/types";

function formatTimestamp(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function StatusBadge({ status }: { status: EcommerceSyncStatus["status"] }) {
  switch (status) {
    case "healthy":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case "stale":
      return (
        <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Stale
        </Badge>
      );
    case "never_connected":
    default:
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Not Connected
        </Badge>
      );
  }
}

function StatusDescription({ status }: { status: EcommerceSyncStatus["status"] }) {
  switch (status) {
    case "healthy":
      return (
        <p className="text-body-md text-muted-foreground">
          Your ecommerce platform is actively sending events. Data is syncing normally.
        </p>
      );
    case "stale":
      return (
        <p className="text-body-md text-yellow-600">
          No events have been received recently. Your integration may need attention —
          check that your ecommerce platform is still configured to send webhooks to this endpoint.
        </p>
      );
    case "never_connected":
    default:
      return (
        <p className="text-body-md text-muted-foreground">
          No ecommerce events have ever been received. Configure your ecommerce platform
          to send webhook events to this system to get started.
        </p>
      );
  }
}

export function EcommerceSyncPage() {
  const [syncStatus, setSyncStatus] = useState<EcommerceSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const result = await ecommerceSyncStatusApi.get();
      setSyncStatus(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sync status.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  if (isLoading) {
    return <DetailSkeleton cards={2} />;
  }

  if (error) {
    return (
      <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Ecommerce Sync
        </h1>
        <div className="p-xl text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Ecommerce Sync
          </h1>
          <p className="text-body-md text-muted-foreground">
            Monitor the connection status between your ecommerce platform and this system.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadStatus(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Connection Status</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            This status reflects the last event received from your ecommerce platform.
            This system does not actively test the connection — it only reports what has been received.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          <div className="flex items-center gap-md">
            <span className="text-base font-medium text-foreground">Status:</span>
            <StatusBadge status={syncStatus!.status} />
          </div>
          <StatusDescription status={syncStatus!.status} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md pt-md border-t border-border">
            <div>
              <span className="text-sm text-muted-foreground">First event received</span>
              <p className="text-base font-medium text-foreground">
                {formatTimestamp(syncStatus!.firstEventReceivedAt)}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Last event received</span>
              <p className="text-base font-medium text-foreground">
                {formatTimestamp(syncStatus!.lastEventReceivedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Webhook Secret</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            The webhook secret is used to verify that incoming events are authentic.
            It is configured on both this system and your ecommerce platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          <div className="flex items-center gap-md">
            <span className="text-base font-medium text-foreground">Configured:</span>
            {syncStatus!.webhookSecretConfigured ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Yes
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </div>
          {syncStatus!.maskedWebhookSecret && (
            <div>
              <span className="text-sm text-muted-foreground">Secret</span>
              <p className="text-base font-mono text-foreground">
                {syncStatus!.maskedWebhookSecret}
              </p>
            </div>
          )}
          {!syncStatus!.webhookSecretConfigured && (
            <p className="text-body-md text-muted-foreground">
              No webhook secret is configured. Set the <code className="text-xs bg-muted px-1 py-0.5 rounded">Ecommerce:WebhookSecret</code> configuration
              value to enable signature validation for incoming webhook events.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
