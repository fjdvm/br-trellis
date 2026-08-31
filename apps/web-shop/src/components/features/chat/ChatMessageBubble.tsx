"use client";

import { useState } from "react";
import { Bot, CheckCheck, Clock, User as UserIcon } from "lucide-react";
import type { ChatMessage } from "@/types/chat";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
}

export function ChatMessageBubble({ message, isSelf }: ChatMessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isBot = message.senderId === "bot" || message.senderType === "bot";
  const isSystem = message.senderId === "system";

  const formattedTime = new Date(message.sentAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullDateTime = new Date(message.sentAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isSystem) {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-700 border border-purple-100 shadow-2xs">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} my-1.5`}>
      {/* Sender Header */}
      {!isSelf && (
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
          {isBot ? (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 text-[#451077]">
              <Bot className="h-3 w-3" />
            </div>
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-600">
              <UserIcon className="h-2.5 w-2.5" />
            </div>
          )}
          <span>{message.senderName || (isBot ? "AI Assistant" : "Support Agent")}</span>
        </div>
      )}

      {/* Bubble Container */}
      <div
        onClick={() => setShowDetails((prev) => !prev)}
        title="Click to view message details"
        className={`group relative max-w-[82%] cursor-pointer rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all hover:shadow-md ${
          isSelf
            ? "bg-[#451077] text-white rounded-br-none"
            : isBot
            ? "bg-purple-50 text-slate-900 border border-purple-200/90 rounded-bl-none"
            : "bg-slate-100 text-slate-900 border border-slate-200/80 rounded-bl-none"
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed text-xs sm:text-sm">
          {message.content}
        </p>
        <span
          className={`block text-[10px] mt-1 text-right font-medium ${
            isSelf ? "text-purple-200" : isBot ? "text-purple-600" : "text-slate-400"
          }`}
        >
          {formattedTime}
        </span>
      </div>

      {/* Click-to-Expand Details Strip */}
      {showDetails && (
        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 px-1 animate-in fade-in duration-150">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> {fullDateTime}
          </span>
          <span>•</span>
          <span>From: {isSelf ? "You" : message.senderName || (isBot ? "AI Bot" : "Agent")}</span>
          {isSelf && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-purple-600 font-medium">
                <CheckCheck className="h-3 w-3" /> {message.isRead ? "Read" : "Sent"}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
