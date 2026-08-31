import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password | Bren Raphael's Ube Jam & Halaya",
  description: "Set a new password for your account",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
