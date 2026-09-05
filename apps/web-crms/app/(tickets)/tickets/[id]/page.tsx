import { TicketDetailPage } from "@/features/conversations/components/ticket-detail-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TicketDetailPage ticketId={id} />;
}
