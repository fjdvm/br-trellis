"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ConversationListProps {
  tickets: any[];
  activeTicketId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ConversationList({
  tickets,
  activeTicketId,
  onSelect,
  isLoading,
  error,
  activeTab,
  onTabChange,
}: ConversationListProps) {
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const unreadCount = tickets.filter((t) => t.unreadMessageCount > 0).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => onTabChange("all")}
        >
          All
        </Button>
        <Button
          variant={activeTab === "unread" ? "default" : "outline"}
          onClick={() => onTabChange("unread")}
        >
          unread
        </Button>
        {unreadCount > 0 && <span>1 Unread</span>}
      </div>

      {tickets.length === 0 ? (
        <div className="p-4 text-muted-foreground">No conversations found.</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`p-3 border-b cursor-pointer ${
                activeTicketId === t.id ? "bg-muted" : ""
              }`}
            >
              <div className="font-semibold flex justify-between">
                <span>{t.customerName}</span>
                {t.unreadMessageCount > 0 && (
                  <Badge variant="secondary">{t.unreadMessageCount}</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{t.lastMessageContent}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
