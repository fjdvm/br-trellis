import { Dashboard } from "@/features/dashboard/components/dashboard";
import { Suspense } from "react";

export default function DashboardPage() {
  return <Suspense fallback={null}>This is the dashboard</Suspense>;
}
