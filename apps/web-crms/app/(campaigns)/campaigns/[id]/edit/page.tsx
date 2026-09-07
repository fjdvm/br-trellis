import { Suspense } from "react";
import { CampaignEditPage } from "@/features/campaigns";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <CampaignEditPage id={id} />
    </Suspense>
  );
}
