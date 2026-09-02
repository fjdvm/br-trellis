import { Campaigns } from "@/components/features/campaigns/Campaigns";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

type TabValue = "All" | "Draft" | "Active" | "Ended";

function normalizeStatus(status?: string): TabValue {
  if (status === "Draft" || status === "Active" || status === "Ended") {
    return status;
  }
  return "All";
}

export default async function Page({ searchParams }: PageProps) {
  const { status } = await searchParams;
  return <Campaigns initialStatus={normalizeStatus(status)} />;
}
