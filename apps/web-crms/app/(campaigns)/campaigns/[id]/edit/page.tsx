import { CampaignEditPage } from "@/features/campaigns/components/campaign-edit-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CampaignEditPage id={id} />;
}
