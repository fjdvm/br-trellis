import { TicketDetailPage } from "@/components/features/conversations/TicketDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TicketDetailPage ticketId={id} />;
}
