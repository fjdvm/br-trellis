"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Clock, User, Loader2, Plus } from "lucide-react";
import { supportApi } from "@/lib/api/support-api";
import type { TicketSummary } from "@/types/chat";

interface TicketListSidebarProps {
  userId?: string;
  activeTicketId?: string;
  onOpenNewTicket?: () => void;
}

export function TicketListSidebar({ userId, activeTicketId, onOpenNewTicket }: TicketListSidebarProps) {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = useCallback(async (silent = false) => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    const data = await supportApi.getCustomerTickets(userId);
    setTickets(data);
    if (!silent) setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets();
  }, [loadTickets]);

  // Poll every 10s
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => loadTickets(true), 10000);
    return () => clearInterval(interval);
  }, [loadTickets, userId]);

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Unclaimed":
        return "bg-amber-400";
      case "Claimed":
      case "Ongoing":
        return "bg-blue-400";
      case "Completed":
        return "bg-emerald-400";
      case "Canceled":
        return "bg-red-400";
      default:
        return "bg-slate-400";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const parseTitle = (title: string) => title.replace(/^\[.+?\]\s*/, "");

  const claimedTickets = tickets.filter((t) => t.status === "Claimed");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sidebar Header */}
      <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#451077]" />
          Conversations
        </h2>
        {onOpenNewTicket && (
          <button
            onClick={onOpenNewTicket}
            className="p-1.5 rounded-lg bg-[#451077] text-white hover:bg-[#340c5a] transition-colors cursor-pointer"
            aria-label="New ticket"
            title="New ticket"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-xs text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mb-2 text-[#451077]" />
            Loading tickets...
          </div>
        ) : claimedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-500 font-medium">No conversations yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Submit a ticket to start a conversation
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {claimedTickets.map((ticket) => {
              const isActive = ticket.id === activeTicketId;
              return (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className={`block px-4 py-3 transition-colors hover:bg-slate-50 ${
                    isActive
                      ? "bg-purple-50 border-l-[3px] border-l-[#451077]"
                      : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getStatusDot(ticket.status)}`} />

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p className={`text-xs font-semibold truncate ${isActive ? "text-[#451077]" : "text-slate-800"}`}>
                        {parseTitle(ticket.title)}
                      </p>

                      {/* Description preview */}
                      {ticket.description && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {ticket.description.split("\n")[0]}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(ticket.updatedAt)}
                        </span>
                        {ticket.assignedToName && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" />
                            {ticket.assignedToName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
