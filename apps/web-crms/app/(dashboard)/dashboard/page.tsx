import { Dashboard } from "@/components/features/dashboard/Dashboard";
import { Suspense } from "react";

export default function DashboardPage() {
  return <Suspense fallback={null}>This is the dashboard</Suspense>;
}
