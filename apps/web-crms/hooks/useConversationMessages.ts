"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { crmClient } from "@/lib/api/crm-client";
import type {
  ConversationMessage,
  PostStaffMessageInput,
} from "@/types/conversation-message";

/**
 * Owns fetching, polling, and (feature 4 / #86) optimistic-append state for a
 * single ticket's message thread. Mirrors `useCustomer.ts`'s existing pattern:
 * fetch on mount, a 10s background poll, a request-id guard against
 * out-of-order responses, and a `lastOptimisticUpdateRef` that suppresses a
 * background poll for 12s after a local optimistic update so a poll can't
 * clobber a just-sent message before the server has it.
 */
export function useConversationMessages(ticketId: string) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(ticketId));
  const [error, setError] = useState<string | null>(null);
  const lastOptimisticUpdateRef = useRef<number>(0);
  const lastRequestIdRef = useRef<number>(0);

  const fetchMessages = useCallback(
    async (isBackground = false) => {
      if (!ticketId) return;
      if (isBackground) {
        if (Date.now() - lastOptimisticUpdateRef.current < 12000) {
          return;
        }
      } else {
        setIsLoading(true);
      }

      const currentRequestId = ++lastRequestIdRef.current;
      setError(null);
      try {
        const data = await crmClient.conversationMessages.listByTicket(ticketId);
        if (currentRequestId === lastRequestIdRef.current) {
          setMessages(data);
        }
      } catch (err) {
        if (currentRequestId === lastRequestIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to load messages."
          );
        }
      } finally {
        if (currentRequestId === lastRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [ticketId]
  );

  useEffect(() => {
    if (!ticketId) return;

    fetchMessages(false);

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [ticketId, fetchMessages]);

  /**
   * Posts a Staff reply with an optimistic append: a locally-constructed
   * message (temp id) appears immediately and is replaced by the server's
   * response on success. On failure the temp message is rolled back and the
   * error re-thrown so the caller can surface it and keep the draft text.
   */
  const sendMessage = useCallback(
    async (input: PostStaffMessageInput) => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: ConversationMessage = {
        id: tempId,
        ticketId,
        senderType: "Staff",
        senderContactId: null,
        senderStaffId: input.senderStaffId,
        senderStaffName: input.senderStaffName,
        content: input.content,
        sentAt: new Date().toISOString(),
      };

      lastOptimisticUpdateRef.current = Date.now();
      setMessages((prev) => [...prev, optimistic]);
      setError(null);

      try {
        const saved = await crmClient.conversationMessages.postStaffMessage(
          ticketId,
          input
        );
        lastOptimisticUpdateRef.current = Date.now();
        setMessages((prev) =>
          prev.map((message) => (message.id === tempId ? saved : message))
        );
        return saved;
      } catch (err) {
        // Roll back the optimistic message and surface the real error.
        setMessages((prev) => prev.filter((message) => message.id !== tempId));
        const message =
          err instanceof Error ? err.message : "Failed to send message.";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [ticketId]
  );

  return {
    messages,
    isLoading,
    error,
    refetch: () => fetchMessages(false),
    sendMessage,
  };
}
