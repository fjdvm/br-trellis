"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

type VerifyStatus = "verifying" | "success" | "error";

export function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerifyStatus>(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : "This confirmation link is missing its token. Please use the link from your email."
  );
  // Guard against React 18 StrictMode double-invocation in dev, which would fire
  // the one-time-token verify request twice.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) return;

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        const apiErr = err as { data?: { detail?: string } };
        setErrorMessage(
          apiErr?.data?.detail ?? "This confirmation link is invalid or has expired."
        );
        setStatus("error");
      });
  }, [token]);

  return (
    <section className="w-full max-w-lg">
      <Card className="border border-border/70 shadow-xl bg-surface-card overflow-hidden">
        <CardHeader className="flex flex-col items-center text-center">
          <Image
            src="/logo.jpeg"
            alt="Bren Raphael's Logo"
            width={64}
            height={64}
            className="w-16 h-16 object-cover shadow-sm mb-4"
          />

          {status === "verifying" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary mb-2">Verifying your email</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Hang tight while we confirm your account.
              </CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary mb-2">Verified User</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                Your email has been confirmed. Your account is now verified and ready to use.
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-error-container/40 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-on-error-container" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary mb-2">Verification failed</CardTitle>
              <CardDescription className="text-sm text-on-surface-variant">
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>

        {status === "success" && (
          <CardContent>
            <p className="text-sm text-on-surface-variant text-center">
              You can now sign in and start exploring Bren Raphael&apos;s Ube Jam &amp; Halaya.
            </p>
          </CardContent>
        )}

        <CardFooter className="justify-center border-t border-border/50 pt-6">
          {status === "success" && (
            <Button
              type="button"
              onClick={() => router.push("/signin")}
              className="w-full bg-primary text-white hover:bg-primary-dark shadow-md cursor-pointer"
            >
              Go to Login
            </Button>
          )}

          {status === "error" && (
            <Button
              type="button"
              onClick={() => router.push("/signup")}
              variant="outline"
              className="w-full cursor-pointer"
            >
              Back to Sign Up
            </Button>
          )}

          {status === "verifying" && (
            <p className="text-sm text-on-surface-variant">Please wait…</p>
          )}
        </CardFooter>
      </Card>
    </section>
  );
}
