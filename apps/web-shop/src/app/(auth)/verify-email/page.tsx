import { Suspense } from "react";
import { VerifyEmailPage } from "@/components/features/auth/VerifyEmailPage";

export const metadata = {
  title: "Verify Email | Bren Raphael's Ube Jam & Halaya",
  description: "Confirm your email address to activate your Bren Raphael's account.",
};

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
