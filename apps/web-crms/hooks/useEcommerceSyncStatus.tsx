"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { crmClient } from "@/lib/api/crm-client";
import type { EcommerceSyncStatus, EcommerceSyncStatusState } from "@/types/ecommerce";

interface EcommerceSyncStatusContextValue {
  status: EcommerceSyncStatusState | null;
  syncStatus: EcommerceSyncStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const EcommerceSyncStatusContext = createContext<EcommerceSyncStatusContextValue>({
  status: null,
  syncStatus: null,
  isLoading: true,
  error: null,
  refresh: () => {},
});

export function EcommerceSyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<EcommerceSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await crmClient.ecommerceSyncStatus.get();
      setSyncStatus(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sync status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <EcommerceSyncStatusContext.Provider
      value={{
        status: syncStatus?.status ?? null,
        syncStatus,
        isLoading,
        error,
        refresh: load,
      }}
    >
      {children}
    </EcommerceSyncStatusContext.Provider>
  );
}

export function useEcommerceSyncStatus() {
  return useContext(EcommerceSyncStatusContext);
}
