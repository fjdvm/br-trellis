import { RedirectToLogin } from "@/features/auth";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-xl font-sans text-body-md text-muted-foreground">Loading...</div>}>
      <RedirectToLogin />
    </Suspense>
  );
}
