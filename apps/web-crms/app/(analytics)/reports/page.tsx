import { AnalyticsReportPage } from "@/features/reports/components/analytics-report-page";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AnalyticsReportPage />
    </Suspense>
  );
}
