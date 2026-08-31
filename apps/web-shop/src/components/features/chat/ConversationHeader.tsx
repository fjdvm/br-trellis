"use client";

import { MessageSquare, User, Info, Ban } from "lucide-react";
import type { TicketSummary } from "@/types/chat";

interface ConversationHeaderProps {
  ticket: TicketSummary | null;
  ticketId: string;
  onToggleDetails?: () => void;
  onCancelTicket?: () => void;
}

export function ConversationHeader({ ticket, ticketId, onToggleDetails, onCancelTicket }: ConversationHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Unclaimed":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Claimed":
      case "Ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Canceled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <MessageSquare className="w-4 h-4 text-purple-300 shrink-0" />
          <h1 className="text-sm sm:text-base font-bold leading-tight truncate">
            {ticket?.title || `Support Ticket #${ticketId.slice(0, 8)}`}
          </h1>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block">
          Ticket ID: <span className="font-mono text-purple-300">{ticketId.slice(0, 8)}...</span>
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span
          className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-full border ${getStatusColor(
            ticket?.status || "Unclaimed"
          )}`}
        >
          {ticket?.status || "Unclaimed"}
        </span>

        <div className="text-right text-xs text-slate-300 hidden md:block">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-purple-300" />
            {ticket?.assignedToName || "Unassigned"}
          </span>
        </div>

        {onCancelTicket && (
          <button
            onClick={onCancelTicket}
            className="p-2 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-900/30 transition-colors cursor-pointer"
            aria-label="Cancel ticket"
            title="Cancel ticket"
          >
            <Ban className="w-4 h-4" />
          </button>
        )}

        {onToggleDetails && (
          <button
            onClick={onToggleDetails}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="View ticket details"
            title="View ticket details"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
