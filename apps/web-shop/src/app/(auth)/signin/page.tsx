import { Suspense } from "react";
import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata = {
  title: "Sign In | Bren Raphael's Ube Jam & Halaya",
  description: "Sign in to your account at Bren Raphael's Ube Jam & Halaya Shop",
};

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
