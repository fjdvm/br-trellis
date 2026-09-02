import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { supportApi } from "@/lib/api/support-api";
import { resolveConversationAccess, toChatMessages } from "@/lib/support/conversation-access";
import { ConversationPage } from "@/components/features/chat/ConversationPage";
import { ConversationWaiting } from "@/components/features/chat/ConversationWaiting";
import { toTicketSummary } from "@/lib/support/ticket-summary";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Conversation | Bren Raphael's Ube Jam & Halaya Shop",
  description: "Real-time support ticket conversation with our support staff",
};

interface SupportTicketPageProps {
  params: Promise<{
    ticketId: string;
  }>;
}

/**
 * Server Component ownership gate (#144, ADR 0005): fetches the Conversation through
 * api-oos's authenticated, ownership-verified endpoint using the signed-in customer's
 * access token, then resolves the render decision. A ticket that doesn't exist or
 * isn't the caller's yields notFound() — the two are indistinguishable. Anonymous
 * access never reaches here: /support is auth-gated at the middleware.
 */
export default async function SupportTicketRoute({ params }: SupportTicketPageProps) {
  const { ticketId } = await params;

  const session = await auth();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const fetchResult = await supportApi.getTicketDetails(ticketId, token);
  const access = resolveConversationAccess(fetchResult);

  if (access.kind === "not-found") {
    notFound();
  }

  if (access.kind === "render-waiting") {
    return <ConversationWaiting ticketId={ticketId} ticket={toTicketSummary(access.conversation)} />;
  }

  const { conversation } = access;
  return (
    <ConversationPage
      ticketId={ticketId}
      ticket={toTicketSummary(conversation)}
      initialMessages={toChatMessages(conversation)}
    />
  );
}
