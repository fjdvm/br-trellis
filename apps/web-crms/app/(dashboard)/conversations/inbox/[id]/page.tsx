import { ConversationsInbox } from "@/components/features/conversations/ConversationsInbox";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ConversationsInbox selectedTicketId={id} />;
}
