"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { createSignalRConnection } from "@/lib/signalr";
import type { ChatMessage } from "@/types/chat";

interface TicketStatusChangedPayload {
  ticketId: string;
  status: string;
  assignedToId?: string | null;
}

interface UseChatSignalRProps {
  ticketId: string | null;
  isAuthenticated: boolean;
  userId?: string;
  identityEmail?: string | null;
  customerName?: string | null;
  botPhase: string;
  isOpen: boolean;
  onReceiveMessage: (msg: ChatMessage) => void;
  onIncrementUnread: () => void;
  onSetBotPhase: (phase: "LIVE_AGENT") => void;
  onSetMessages: (messages: ChatMessage[]) => void;
  onTicketStatusChanged?: (payload: TicketStatusChangedPayload) => void;
}

export function useChatSignalR({
  ticketId,
  isAuthenticated,
  userId,
  identityEmail,
  customerName,
  botPhase,
  isOpen,
  onReceiveMessage,
  onIncrementUnread,
  onSetBotPhase,
  onSetMessages,
  onTicketStatusChanged,
}: UseChatSignalRProps) {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isOpenRef = useRef(isOpen);

  // Use refs for callback props to avoid re-triggering the connection effect
  const onReceiveMessageRef = useRef(onReceiveMessage);
  const onIncrementUnreadRef = useRef(onIncrementUnread);
  const onSetBotPhaseRef = useRef(onSetBotPhase);
  const onSetMessagesRef = useRef(onSetMessages);
  const onTicketStatusChangedRef = useRef(onTicketStatusChanged);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { onReceiveMessageRef.current = onReceiveMessage; }, [onReceiveMessage]);
  useEffect(() => { onIncrementUnreadRef.current = onIncrementUnread; }, [onIncrementUnread]);
  useEffect(() => { onSetBotPhaseRef.current = onSetBotPhase; }, [onSetBotPhase]);
  useEffect(() => { onSetMessagesRef.current = onSetMessages; }, [onSetMessages]);
  useEffect(() => { onTicketStatusChangedRef.current = onTicketStatusChanged; }, [onTicketStatusChanged]);

  // Track whether auth was ever established to prevent flicker-induced disconnection
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticatedRef.current = true;
    }
  }, [isAuthenticated]);

  // Refs for identity so the stable send callback always sees the latest values.
  const identityEmailRef = useRef(identityEmail);
  const customerNameRef = useRef(customerName);
  useEffect(() => { identityEmailRef.current = identityEmail; }, [identityEmail]);
  useEffect(() => { customerNameRef.current = customerName; }, [customerName]);

  // Connect the api-oos chat hub ONLY when in LIVE_AGENT phase and a conversation exists.
  useEffect(() => {
    // Use wasAuthenticatedRef to prevent disconnection during session refresh flickers.
    const effectivelyAuthenticated = isAuthenticated || wasAuthenticatedRef.current;
    if (!ticketId || !effectivelyAuthenticated || botPhase !== "LIVE_AGENT") return;

    const connection = createSignalRConnection();
    connectionRef.current = connection;

    connection.on("ReceiveMessage", (msg: ChatMessage) => {
      onReceiveMessageRef.current(msg);
      if (!isOpenRef.current && msg.senderId !== userId) {
        onIncrementUnreadRef.current();
      }
    });

    connection.on("TicketStatusChanged", (payload: TicketStatusChangedPayload) => {
      onTicketStatusChangedRef.current?.(payload);
    });

    const startPromise = connection
      .start()
      .then(() => {
        setIsConnected(true);
        return connection.invoke("JoinConversation", ticketId).catch(console.error);
      })
      .catch((err) => {
        console.error("SignalR connection error:", err);
      });

    return () => {
      const conn = connection;
      connectionRef.current = null;
      setIsConnected(false);

      // Defer teardown until the start (and JoinConversation) promise settles, so
      // stop() never races an in-flight negotiate — calling stop() mid-negotiation
      // throws "The connection was stopped during negotiation" (hit reliably under
      // React StrictMode's mount/cleanup/mount double-invoke in dev).
      const cleanup = async () => {
        await startPromise.catch(() => undefined);
        try {
          if (conn.state === signalR.HubConnectionState.Connected) {
            await conn.invoke("LeaveConversation", ticketId);
          }
        } catch {
          // Connection may already be closing — ignore errors
        } finally {
          try {
            await conn.stop();
          } catch {
            // Ignore stop errors
          }
        }
      };
      cleanup();
    };
  }, [ticketId, botPhase, userId, isAuthenticated]);

  const sendSignalRMessage = useCallback(
    async (text: string) => {
      if (!ticketId) return false;
      const email = identityEmailRef.current;
      if (!email) return false; // Identity Handshake gate — no anonymous messaging.
      const connection = connectionRef.current;
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        try {
          await connection.invoke("SendMessage", {
            conversationId: ticketId,
            customerEmail: email,
            customerName: customerNameRef.current ?? null,
            content: text,
          });
          return true;
        } catch (err) {
          console.error("Failed to send message via SignalR:", err);
        }
      }
      return false;
    },
    [ticketId]
  );

  return {
    isConnected,
    sendSignalRMessage,
  };
}
