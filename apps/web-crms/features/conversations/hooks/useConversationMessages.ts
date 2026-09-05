"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { conversationMessagesApi } from "@/features/conversations/services/conversations-api";
import type {
  ConversationMessage,
  PostStaffMessageInput,
} from "@/features/conversations/types";

/**
 * Owns fetching, polling, and (feature 4 / #86) optimistic-append state for a
 * single ticket's message thread. Mirrors `useCustomer.ts`'s existing pattern:
 * fetch on mount, a 60s background fallback poll, a request-id guard against
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
        const data = await conversationMessagesApi.listByTicket(ticketId);
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
    lastOptimisticUpdateRef.current = 0;
    setMessages([]);
    setError(null);
    void fetchMessages();
  }, [ticketId, fetchMessages]);

  useEffect(() => {
    if (!ticketId) return;
    const intervalId = setInterval(() => {
      void fetchMessages(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [ticketId, fetchMessages]);

  /**
   * Posts a Staff reply with an optimistic append: a locally-constructed
   * message (temp id) appears immediately and is replaced by the server's
   * response on success. On failure the temp message is rolled back and the
   * error re-thrown so the caller can surface it and keep the draft text.
   */
  const sendMessage = useCallback(
    async (input: PostStaffMessageInput) => {
      if (!ticketId) return null;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: ConversationMessage = {
        id: tempId,
        ticketId,
        senderType: "Staff",
        senderContactId: null,
        senderStaffId: input.senderStaffId,
        senderStaffName: input.senderStaffName ?? "Support Staff",
        content: input.content,
        sentAt: new Date().toISOString(),
      };

      lastOptimisticUpdateRef.current = Date.now();
      setMessages((prev) => [...prev, optimistic]);
      setError(null);

      try {
        const saved = await conversationMessagesApi.postStaffMessage(
          ticketId,
          input
        );
        lastOptimisticUpdateRef.current = Date.now();
        setMessages((prev) => {
          // The same saved message may already be in the list if its real-time
          // broadcast arrived over the hub before this POST response resolved
          // (a race between the SignalR push and the HTTP reply). In that case,
          // renaming the temp message to the saved id would create two entries
          // with the same id (the duplicate-key crash). Instead: if the saved id
          // is already present, just drop the temp message; otherwise reconcile
          // the temp entry into the saved one.
          const alreadyPresent = prev.some((m) => m.id === saved.id);
          if (alreadyPresent) {
            return prev.filter((message) => message.id !== tempId);
          }
          return prev.map((message) => (message.id === tempId ? saved : message));
        });
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

  /**
   * Merges a message pushed in over the real-time hub (useSignalR's
   * `onReceiveMessage`) into thread state, de-duplicating by id so a message
   * already present — from the initial fetch, a poll, or this agent's own
   * optimistic send that has since been reconciled — is never appended twice.
   * This is the guard that stops an agent's own reply from showing twice when
   * its own broadcast arrives back.
   */
  const appendMessage = useCallback((incoming: ConversationMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) {
        return prev;
      }
      return [...prev, incoming];
    });
  }, []);

  return {
    messages,
    isLoading,
    error,
    refetch: () => fetchMessages(false),
    sendMessage,
    appendMessage,
  };
}
