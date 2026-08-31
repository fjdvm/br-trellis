"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { createSignalRConnection } from "@/lib/signalr";
import type { ChatMessage } from "@/types/chat";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";
interface TicketStatusChangedPayload {
  ticketId: string;
  status: string;
  assignedToId?: string | null;
}

interface UseChatSignalRProps {
  ticketId: string | null;
  isAuthenticated: boolean;
  userId?: string;
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

  // Fetch initial message history from CRM via backend API proxy
  const fetchMessages = useCallback(
    async (activeTicketId: string) => {
      try {
        const res = await fetch(`${API_BASE_URL}/tickets/${activeTicketId}/messages`);
        if (res.ok) {
          const data: ChatMessage[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            onSetMessagesRef.current(data);
            onSetBotPhaseRef.current("LIVE_AGENT");
          }
        }
      } catch (err) {
        console.error("Failed to load message history:", err);
      }
    },
    [] // No dependencies — uses refs for callbacks
  );

  // Connect SignalR hub ONLY when in LIVE_AGENT phase and ticketId exists
  useEffect(() => {
    // Use wasAuthenticatedRef to prevent disconnection during session refresh flickers.
    // Only require that auth was established at some point (not that it's currently "authenticated"
    // which can briefly flicker to false during session refetches).
    const effectivelyAuthenticated = isAuthenticated || wasAuthenticatedRef.current;
    if (!ticketId || !effectivelyAuthenticated || botPhase !== "LIVE_AGENT") return;

    fetchMessages(ticketId);

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

    connection
      .start()
      .then(() => {
        setIsConnected(true);
        connection.invoke("JoinTicket", ticketId).catch(console.error);
      })
      .catch((err) => {
        console.error("SignalR connection error:", err);
      });

    return () => {
      const conn = connection;
      connectionRef.current = null;
      setIsConnected(false);

      // Gracefully leave the ticket group and then stop the connection.
      // Await the LeaveTicket invocation before calling stop() to prevent
      // "Invocation canceled due to the underlying connection being closed".
      const cleanup = async () => {
        try {
          if (conn.state === signalR.HubConnectionState.Connected) {
            await conn.invoke("LeaveTicket", ticketId);
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
  }, [ticketId, botPhase, fetchMessages, userId, isAuthenticated]);

  const sendSignalRMessage = useCallback(
    async (text: string) => {
      if (!ticketId || !userId) return false;
      const connection = connectionRef.current;
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        try {
          await connection.invoke("SendMessage", ticketId, userId, text, "customer");
          return true;
        } catch (err) {
          console.error("Failed to send message via SignalR:", err);
        }
      }
      return false;
    },
    [ticketId, userId]
  );

  return {
    isConnected,
    sendSignalRMessage,
  };
}
