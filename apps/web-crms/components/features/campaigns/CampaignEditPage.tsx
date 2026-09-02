"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CampaignWizard } from "@/components/features/campaigns/CampaignWizard";
import { useCampaign } from "@/hooks/useCampaign";

export function CampaignEditPage({ id }: { id: string }) {
  const { data: campaign, isLoading } = useCampaign(id);

  if (isLoading) {
    return (
      <div className="p-xl space-y-md max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-xl text-muted-foreground">Campaign not found.</div>;
  }

  if (campaign.status !== "Draft") {
    return (
      <div className="p-xl text-muted-foreground">
        Only Draft campaigns can be edited.
      </div>
    );
  }

  return <CampaignWizard existing={campaign} />;
}
