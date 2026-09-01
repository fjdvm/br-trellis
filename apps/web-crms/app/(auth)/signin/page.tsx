import { RedirectToLogin } from "@/components/shared/RedirectToLogin";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-xl font-sans text-body-md text-muted-foreground">Loading...</div>}>
      <RedirectToLogin />
    </Suspense>
  );
}
