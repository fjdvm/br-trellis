"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function RedirectToLogin() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    signIn("authservice", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      Redirecting to sign in...
    </div>
  );
}