"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * Monitors the session for token refresh errors.
 * When the refresh token has expired and cannot be renewed,
 * automatically signs the user out so they are redirected to login.
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenExpired") {
      // The refresh token is no longer valid — force sign out
      signOut({ redirectTo: "/signin" });
    }
  }, [session?.error]);

  return <>{children}</>;
}
