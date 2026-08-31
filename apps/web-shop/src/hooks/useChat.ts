"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api/api-client";
import { supportApi } from "@/lib/api/support-api";
import { useChatSignalR } from "./useChatSignalR";
import type { ChatMessage, SupportTicketResponse, BotReplyResponse } from "@/types/chat";

export type BotPhase = "BOT_GREETING" | "BOT_THINKING" | "BOT_RESPONDED" | "ESCALATE_PROMPT" | "LIVE_AGENT";

interface UseChatOptions {
  onTicketStatusChanged?: (payload: { ticketId: string; status: string; assignedToId?: string | null }) => void;
}

export function useChat(initialTicketId?: string, options?: UseChatOptions) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(initialTicketId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botPhase, setBotPhase] = useState<BotPhase>(initialTicketId ? "LIVE_AGENT" : "BOT_GREETING");

  const token = (session as { accessToken?: string })?.accessToken;
  const isAuthenticated = status === "authenticated" && Boolean(session?.user) && Boolean(token);
  const userId = session?.user?.id;

  // --- Identity Handshake (session-state only) ---
  // A visitor must supply an identifying email before any chat message can be sent,
  // bot or live-agent. Authenticated customers skip the Handshake entirely — their
  // account email is used automatically. The captured/derived email is held here in
  // session state, ready to be attached to outbound calls built in later tickets.
  const [handshakeEmail, setHandshakeEmail] = useState<string | null>(null);
  const accountEmail = session?.user?.email ?? null;
  const identityEmail = isAuthenticated ? accountEmail : handshakeEmail;
  const isIdentified = Boolean(identityEmail);

  const submitHandshakeEmail = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase();
    // Minimal shape check — full validation/Identity Resolution happens server-side.
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    if (!looksLikeEmail) {
      setError("Please enter a valid email address to start the chat.");
      return false;
    }
    setHandshakeEmail(normalized);
    setError(null);
    return true;
  }, []);

  const handleReceiveMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const handleIncrementUnread = useCallback(() => setUnreadCount((prev) => prev + 1), []);

  const { isConnected, sendSignalRMessage } = useChatSignalR({
    ticketId,
    isAuthenticated,
    userId,
    identityEmail,
    customerName: session?.user?.name ?? null,
    botPhase,
    isOpen,
    onReceiveMessage: handleReceiveMessage,
    onIncrementUnread: handleIncrementUnread,
    onSetBotPhase: setBotPhase,
    onSetMessages: setMessages,
    onTicketStatusChanged: options?.onTicketStatusChanged,
  });

  useEffect(() => {
    if (messages.length === 0 && !initialTicketId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([{
        id: "bot-greeting",
        senderId: "bot",
        senderName: "Support Assistant",
        senderType: "bot",
        content: "Hello! 👋 Welcome to Bren Raphael's Ube Jam & Halaya Shop support. How can I assist you today?",
        isRead: true,
        sentAt: new Date().toISOString(),
      }]);
    }
  }, [messages.length, initialTicketId]);

  // Initialize or retrieve ticketId
  const getOrCreateTicket = useCallback(async () => {
    if (!userId || !token) return null;
    if (ticketId) return ticketId;

    const storageKey = `br_chat_ticket_${userId}`;
    const existingTicket = localStorage.getItem(storageKey);
    if (existingTicket) {
      setTicketId(existingTicket);
      return existingTicket;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post<SupportTicketResponse>(
        "/webhooks/support-ticket",
        {},
        { token }
      );
      if (res?.ticketId) {
        localStorage.setItem(storageKey, res.ticketId);
        setTicketId(res.ticketId);
        return res.ticketId;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize support chat session.");
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [userId, token, ticketId]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  }, []);

  const escalateToLiveAgent = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Please sign in to your account to connect to a live support representative.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const activeTicketId = await getOrCreateTicket();
      if (activeTicketId) {
        setBotPhase("LIVE_AGENT");
        setMessages((prev) => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            senderId: "system",
            senderName: "System",
            senderType: "agent",
            content: "You have requested a live support representative. Connecting you to a support agent...",
            isRead: true,
            sentAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getOrCreateTicket]);

  const sendMessage = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text) return;

      // Identity Handshake gate: no message (bot or live-agent) leaves the widget
      // until the visitor is identified. Authenticated customers are always
      // identified via their account email, so this only blocks anonymous visitors
      // who haven't completed the Handshake yet.
      if (!isIdentified) {
        setError("Please provide your email to start the chat.");
        return;
      }

      const currentUserId = userId || "guest";
      const currentUserName = session?.user?.name || "Guest";

      // 1. Live agent phase
      if (botPhase === "LIVE_AGENT") {
        await sendSignalRMessage(text);
        return;
      }

      // 2. Bot phase
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        senderId: currentUserId,
        senderName: currentUserName,
        senderType: "user",
        content: text,
        isRead: true,
        sentAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setBotPhase("BOT_THINKING");
      setIsBotReplying(true);

      try {
        const reply: BotReplyResponse = isAuthenticated
          ? await supportApi.getBotReply(text, ticketId || undefined, token)
          : await supportApi.getPublicBotReply(text);

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          senderId: "bot",
          senderName: "Support Assistant",
          senderType: "bot",
          content: reply.reply,
          isRead: true,
          sentAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMsg]);
        setBotPhase(reply.shouldEscalate ? "ESCALATE_PROMPT" : "BOT_RESPONDED");
      } catch (err) {
        console.error("Bot reply error:", err);
        setBotPhase("ESCALATE_PROMPT");
      } finally {
        setIsBotReplying(false);
      }
    },
    [botPhase, ticketId, userId, session?.user?.name, token, isAuthenticated, isIdentified, sendSignalRMessage]
  );

  return {
    isOpen,
    toggleOpen,
    setIsOpen,
    messages,
    unreadCount,
    isConnected,
    isLoading,
    isBotReplying,
    botPhase,
    error,
    isAuthenticated,
    sendMessage,
    escalateToLiveAgent,
    ticketId,
    // Identity Handshake
    isIdentified,
    identityEmail,
    submitHandshakeEmail,
  };
}
