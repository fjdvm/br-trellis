"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

export function RedirectToLogin() {
  useEffect(() => {
    signIn("authservice", { callbackUrl: "https://localhost:3004/" });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Redirecting to login...</h2>
      </div>
    </div>
  );
}
