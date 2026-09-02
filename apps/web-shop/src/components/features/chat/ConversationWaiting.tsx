"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { Clock, ShieldCheck } from "lucide-react";
import { createSignalRConnection } from "@/lib/signalr";
import { ConversationLayout } from "./ConversationLayout";
import type { ChatMessage, TicketSummary } from "@/types/chat";

interface ConversationWaitingProps {
  ticketId: string;
  /** Server-verified ticket summary — subject/status only; no thread is shown here. */
  ticket: TicketSummary;
}

/**
 * The pre-staff-reply "waiting" state (#145). An owner-verified Contact whose
 * Conversation has no Staff message yet sees this instead of the thread: subject/status
 * only, no message history, no input. It joins the same per-ticket SignalR group the
 * live ConversationPage uses (group membership doesn't depend on the staff-reply gate)
 * and, the moment a Staff-authored message arrives, calls router.refresh() so the
 * Server Component re-resolves access and swaps in the full conversation — no manual
 * refresh. It does NOT reconstruct conversation state on the client; the server stays
 * the single source of truth for the gate.
 */
export function ConversationWaiting({ ticketId }: ConversationWaitingProps) {
  const router = useRouter();

  useEffect(() => {
    const connection = createSignalRConnection();

    connection.on("ReceiveMessage", (msg: ChatMessage) => {
      // A Staff/agent-authored message unlocks the Conversation. Re-fetch server-side
      // rather than rendering the message here, so the gate is re-evaluated by api-oos.
      if (msg.senderType === "agent") {
        router.refresh();
      }
    });

    const startPromise = connection
      .start()
      .then(() => connection.invoke("JoinConversation", ticketId).catch(console.error))
      .catch((err) => console.error("SignalR connection error:", err));

    return () => {
      const conn = connection;
      const cleanup = async () => {
        await startPromise.catch(() => undefined);
        try {
          if (conn.state === signalR.HubConnectionState.Connected) {
            await conn.invoke("LeaveConversation", ticketId);
          }
        } catch {
          // Connection may already be closing — ignore.
        } finally {
          try {
            await conn.stop();
          } catch {
            // Ignore stop errors.
          }
        }
      };
      cleanup();
    };
  }, [ticketId, router]);

  return (
    <ConversationLayout activeTicketId={ticketId}>
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <Clock className="w-8 h-8 text-[#451077] animate-pulse" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700">Waiting for a support agent</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Your ticket is in the queue. As soon as a member of our support team replies,
            this conversation will open here automatically — no need to refresh.
          </p>
          <div className="flex items-center gap-2 mt-6 text-xs text-purple-600 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>You&apos;ll be connected shortly</span>
          </div>
        </div>
      </div>
    </ConversationLayout>
  );
}
