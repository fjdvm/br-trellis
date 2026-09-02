import { CampaignDetail } from "@/components/features/campaigns/CampaignDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CampaignDetail id={id} />;
}
