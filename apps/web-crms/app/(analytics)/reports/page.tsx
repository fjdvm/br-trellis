import { AnalyticsReportPage } from "@/features/analytics-report";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsReportPage />
    </Suspense>
  );
}
