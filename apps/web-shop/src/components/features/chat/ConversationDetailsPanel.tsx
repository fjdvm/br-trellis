"use client";

import { X, Calendar, User, Tag, FileText, Clock, Hash } from "lucide-react";
import type { TicketSummary } from "@/types/chat";

interface ConversationDetailsPanelProps {
  ticket: TicketSummary;
  onClose: () => void;
}

export function ConversationDetailsPanel({ ticket, onClose }: ConversationDetailsPanelProps) {
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

  const parseTicketType = (title: string): string | null => {
    const match = title.match(/^\[(.+?)\]\s*/);
    return match ? match[1] : null;
  };

  const parseTicketTitle = (title: string): string => {
    return title.replace(/^\[.+?\]\s*/, "");
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const ticketType = parseTicketType(ticket.title);
  const displayTitle = parseTicketTitle(ticket.title);

  return (
    <div className="absolute inset-0 z-20 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-80 bg-white border-l border-slate-200 shadow-lg flex flex-col animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800">Ticket Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close details panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">{displayTitle}</h3>
            {ticketType && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                <Tag className="w-3 h-3" />
                {ticketType}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Status
            </label>
            <div>
              <span
                className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                  ticket.status
                )}`}
              >
                {ticket.status}
              </span>
            </div>
          </div>

          {/* Assigned Agent */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <User className="w-3 h-3" /> Assigned Agent
            </label>
            <p className="text-sm text-slate-700 font-medium">
              {ticket.assignedToName || "Unassigned"}
            </p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <FileText className="w-3 h-3" /> Description
            </label>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words bg-slate-50 rounded-lg p-3 border border-slate-100">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* Created At */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Created
            </label>
            <p className="text-sm text-slate-700 font-medium">
              {formatDate(ticket.createdAt)}
            </p>
          </div>

          {/* Updated At */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last Updated
            </label>
            <p className="text-sm text-slate-700 font-medium">
              {formatDate(ticket.updatedAt)}
            </p>
          </div>

          {/* Ticket ID */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Hash className="w-3 h-3" /> Ticket ID
            </label>
            <p className="text-xs text-slate-600 font-mono bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-100 break-all">
              {ticket.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
