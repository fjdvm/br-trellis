"use client";

import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Send, Loader2, ShieldCheck, Ban } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { CancelTicketModal } from "./CancelTicketModal";
import { ConversationLayout } from "./ConversationLayout";
import { supportApi } from "@/lib/api/support-api";
import type { TicketSummary, ChatMessage } from "@/types/chat";

interface ConversationPageProps {
  ticketId: string;
  /** Server-verified ticket summary (#144). Rendered directly — no client-side fetch. */
  ticket: TicketSummary;
  /** Server-hydrated, chronological message history for the owner-verified Conversation. */
  initialMessages: ChatMessage[];
}

export function ConversationPage({ ticketId, ticket: initialTicket, initialMessages }: ConversationPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [ticket, setTicket] = useState<TicketSummary | null>(initialTicket);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTicketStatusChanged = useCallback(
    (payload: { ticketId: string; status: string; assignedToId?: string | null }) => {
      if (payload.ticketId === ticketId) {
        setTicket((prev) =>
          prev ? { ...prev, status: payload.status, assignedToName: payload.assignedToId || undefined } : null
        );
      }
    },
    [ticketId]
  );

  const {
    messages,
    isConnected,
    error: chatError,
    sendMessage,
  } = useChat(ticketId, { onTicketStatusChanged: handleTicketStatusChanged, initialMessages });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const text = input.trim();
    setInput("");
    setIsSending(true);
    try {
      await sendMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelTicket = async () => {
    setIsCancelling(true);
    try {
      const success = await supportApi.cancelTicket(ticketId, token);
      if (success) {
        setTicket((prev) => (prev ? { ...prev, status: "Canceled" } : null));
        setShowCancelModal(false);
        router.push("/support");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const isClosed = ticket?.status === "Completed" || ticket?.status === "Canceled";

  return (
    <ConversationLayout activeTicketId={ticketId}>
      <div className="flex flex-col h-full relative">
        {/* Connection status banner */}
        <div className="bg-purple-50 px-4 sm:px-6 py-2 border-b border-purple-100 flex items-center justify-between text-xs text-purple-900 font-medium shrink-0">
          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isConnected ? "Real-time chat active" : "Connecting..."}
          </span>
          <span className="flex items-center gap-3">
            {!isClosed && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                aria-label="Cancel ticket"
                title="Cancel ticket"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cancel ticket</span>
              </button>
            )}
            <span className="text-[11px] text-purple-600 hidden sm:block">Bren Raphael Support</span>
          </span>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {chatError && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200">
              {chatError}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <ShieldCheck className="w-10 h-10 mb-2 text-purple-200" />
              <p className="text-sm font-semibold text-slate-600">No messages yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Send a message below to start communicating with our support team.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} isSelf={msg.senderType === "user"} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {isClosed ? (
          <div className="p-4 bg-slate-100 text-center text-xs text-slate-500 border-t border-slate-200 font-medium shrink-0">
            This ticket is closed ({ticket?.status}). You cannot send further messages.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-resize
                  const el = textareaRef.current;
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                    // Reset height after send
                    const el = textareaRef.current;
                    if (el) {
                      el.style.height = "auto";
                    }
                  }
                }}
                placeholder="Type your message..."
                disabled={isSending}
                rows={1}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-[#451077] focus:ring-1 focus:ring-[#451077] disabled:opacity-50 resize-none overflow-y-auto max-h-32"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="inline-flex items-center justify-center h-10 px-4 sm:px-5 bg-[#451077] text-white text-xs font-semibold rounded-xl hover:bg-[#340c5a] transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Send</span>
                    <Send className="w-3.5 h-3.5 sm:ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Cancel Modal */}
        <CancelTicketModal
          isOpen={showCancelModal}
          isCancelling={isCancelling}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelTicket}
        />
      </div>
    </ConversationLayout>
  );
}
