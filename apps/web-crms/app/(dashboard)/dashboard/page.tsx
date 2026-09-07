import { Dashboard } from "@/features/dashboard";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}
