import { CompanyDetailPage } from "@/features/contacts/components/company-detail-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CompanyDetailPage companyId={id} />;
}
