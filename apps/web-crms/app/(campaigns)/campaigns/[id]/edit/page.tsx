import { CampaignEditPage } from "@/components/features/campaigns/CampaignEditPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CampaignEditPage id={id} />;
}
