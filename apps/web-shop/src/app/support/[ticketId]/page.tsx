import { ConversationPage } from "@/components/features/chat/ConversationPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Conversation | Bren Raphael's Ube Jam & Halaya Shop",
  description: "Real-time support ticket conversation with SentraCX staff",
};

interface SupportTicketPageProps {
  params: Promise<{
    ticketId: string;
  }>;
}

export default async function SupportTicketRoute({ params }: SupportTicketPageProps) {
  const { ticketId } = await params;
  return <ConversationPage ticketId={ticketId} />;
}
