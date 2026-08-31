"use client";

import { MessageSquare, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatPanel } from "./ChatPanel";
import { ChatUnreadBadge } from "./ChatUnreadBadge";

export function ChatBubble() {
  const pathname = usePathname();
  const {
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
  } = useChat();

  const isSupportPage = pathname?.startsWith("/support");

  if (isSupportPage) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-5 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#451077] text-white shadow-xl transition-all hover:bg-[#340c5a] hover:scale-105 active:scale-95"
        aria-label="Toggle Live Chat Support"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
            <ChatUnreadBadge count={unreadCount} />
          </div>
        )}
      </button>

      {/* Slide-up Chat Panel */}
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        sendMessage={sendMessage}
        escalateToLiveAgent={escalateToLiveAgent}
        isConnected={isConnected}
        isLoading={isLoading}
        isBotReplying={isBotReplying}
        botPhase={botPhase}
        error={error}
        isAuthenticated={isAuthenticated}
      />
    </>
  );
}
