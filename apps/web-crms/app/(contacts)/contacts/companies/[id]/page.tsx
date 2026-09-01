import { CompanyDetailPage } from "@/components/features/contacts/CompanyDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CompanyDetailPage companyId={id} />;
}
