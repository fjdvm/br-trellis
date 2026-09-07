import { Suspense } from "react";
import { CampaignWizard } from "@/features/campaigns";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CampaignWizard />
    </Suspense>
  );
}
