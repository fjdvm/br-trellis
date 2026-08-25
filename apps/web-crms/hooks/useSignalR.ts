"use client";

import { useCallback, useState } from "react";
import { Message } from "@/types/message";
import { Ticket } from "@/types/ticket";

interface TicketStatusChangedPayload {
  ticketId: string;
  status: string;
  assignedToId?: string | null;
}

interface UseSignalROptions {
  ticketId?: string | null;
  onReceiveMessage?: (msg: Message) => void;
  onMessageRead?: (messageId: string) => void;
  onNewMessageNotification?: (ticketId: string, message: Message) => void;
  onNewTicketAvailable?: (ticket: Ticket) => void;
  onTicketStatusChanged?: (payload: TicketStatusChangedPayload) => void;
}

export function useSignalR(_options?: UseSignalROptions) {
  const [isConnected] = useState(false);

  const sendMessage = useCallback(
    async (_targetTicketId: string, _senderId: string, _content: string, _senderType = "employee") => {
      // WebSocket disabled
    },
    []
  );

  const markMessageRead = useCallback(
    async (_messageId: string) => {
      // WebSocket disabled
    },
    []
  );

  return {
    isConnected,
    sendMessage,
    markMessageRead,
  };
}
