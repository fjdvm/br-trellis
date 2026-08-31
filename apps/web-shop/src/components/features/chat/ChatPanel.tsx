"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { MessageSquare, Send, X, Loader2, Lock, Bot, UserCheck } from "lucide-react";
import { ChatMessageBubble } from "./ChatMessageBubble";
import type { ChatMessage } from "@/types/chat";
import type { BotPhase } from "@/hooks/useChat";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  escalateToLiveAgent: () => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  isBotReplying?: boolean;
  botPhase: BotPhase;
  error: string | null;
  isAuthenticated: boolean;
  userId?: string;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  sendMessage,
  escalateToLiveAgent,
  isConnected,
  isLoading,
  isBotReplying,
  botPhase,
  error,
  isAuthenticated,
  userId,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isBotReplying, botPhase]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || isBotReplying) return;

    const text = input.trim();
    setInput("");
    setIsSending(true);
    try {
      await sendMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const isLive = botPhase === "LIVE_AGENT";

  return (
    <div className="fixed bottom-20 right-5 z-50 flex h-[530px] w-80 flex-col overflow-hidden rounded-2xl border border-purple-200/80 bg-white shadow-2xl transition-all sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#451077] px-4 py-3 text-white">
        <div className="flex items-center space-x-2">
          <div className="relative">
            {isLive ? (
              <MessageSquare className="h-5 w-5 text-purple-200" />
            ) : (
              <Bot className="h-5 w-5 text-purple-200" />
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#451077] ${
                isLive
                  ? isConnected
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                  : "bg-blue-400"
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">SentraCX Support</h3>
            <p className="text-[11px] text-purple-200">
              {isLive
                ? isConnected
                  ? "Connected to Live Agent"
                  : "Connecting to Agent..."
                : "AI Support Assistant"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-purple-200 hover:bg-white/10 hover:text-white"
          aria-label="Close live chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content Body */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-[#451077]" />
        </div>
      ) : (
        <>
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {error}
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isSelf={msg.senderId === userId}
              />
            ))}

            {/* AI Bot Typing Indicator */}
            {isBotReplying && (
              <div className="flex items-center gap-2 text-xs text-purple-600 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>AI Assistant is analyzing...</span>
              </div>
            )}

            {/* Escalation Prompt Card */}
            {(botPhase === "ESCALATE_PROMPT" || botPhase === "BOT_RESPONDED") && (
              <div className="my-3 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 text-center shadow-2xs">
                <p className="text-xs font-semibold text-purple-900 mb-2">
                  Need more help? Connect to a human agent.
                </p>
                {isAuthenticated ? (
                  <button
                    onClick={() => escalateToLiveAgent()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#451077] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#340c5a] transition-all cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Connect to Live Agent
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-purple-700">Sign in required to talk to live staff.</p>
                    <Link
                      href="/signin"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#451077] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#340c5a]"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Sign In to Connect
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>


          {/* Input Footer */}
          <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-slate-50/50 p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLive ? "Type a message to agent..." : "Ask AI support assistant..."}
                disabled={isBotReplying}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#451077] focus:outline-none focus:ring-1 focus:ring-[#451077] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending || isBotReplying}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#451077] text-white shadow-sm hover:bg-[#340c5a] disabled:opacity-50 disabled:hover:bg-[#451077]"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
