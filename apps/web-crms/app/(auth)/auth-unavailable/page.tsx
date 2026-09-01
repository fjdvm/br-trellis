"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ServerCrash } from "lucide-react";

export default function AuthUnavailablePage() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  // Auto-retry every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/health", { method: "GET" });
        if (res.ok) {
          router.push("/signin");
        }
      } catch {
        // Still unavailable
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [router]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/auth/health", { method: "GET" });
      if (res.ok) {
        router.push("/signin");
        return;
      }
    } catch {
      // Still down
    }
    setRetrying(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
      <div className="p-4 bg-muted rounded-full mb-6">
        <ServerCrash className="w-16 h-16 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
        404 Service Not Found
      </h1>
      <p className="text-muted-foreground mx-w-6xl mb-4">
        The authentication service is currently unreachable. This could mean the
        service is down for maintenance or temporarily unavailable.
      </p>
      <p className="text-sm text-muted-foreground/70 mb-8">
        The page will automatically retry when the service becomes available.
      </p>
      <button
        onClick={handleRetry}
        disabled={retrying}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {retrying ? "Checking..." : "Retry Now"}
      </button>
    </div>
  );
}
