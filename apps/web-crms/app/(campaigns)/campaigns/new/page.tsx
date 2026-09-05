import { Suspense } from "react";
import { CampaignWizard } from "@/features/campaigns/components/campaign-wizard";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CampaignWizard />
    </Suspense>
  );
}
