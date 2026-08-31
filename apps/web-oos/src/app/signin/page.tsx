import { RedirectToLogin } from "@/components/shared/RedirectToLogin";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-10 font-sans">Loading...</div>}>
      <RedirectToLogin />
    </Suspense>
  );
}
