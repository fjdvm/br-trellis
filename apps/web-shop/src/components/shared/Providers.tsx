"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { SessionGuard } from "./SessionGuard";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard>
        {children}
      </SessionGuard>
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
