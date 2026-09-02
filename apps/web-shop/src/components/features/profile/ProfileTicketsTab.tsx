"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Headphones, Plus, Clock, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { supportApi } from "@/lib/api/support-api";
import { TicketSubmitDialog } from "./TicketSubmitDialog";
import type { TicketSummary } from "@/types/chat";

interface ProfileTicketsTabProps {
  userId?: string;
  onOpenLiveChat?: () => void;
}

export function ProfileTicketsTab({ userId, onOpenLiveChat }: ProfileTicketsTabProps) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const loadTickets = useCallback(async (silent = false) => {
    if (!token) {
      return;
    }
    if (!silent) setIsLoading(true);
    const data = await supportApi.getCustomerTickets(token);
    setTickets(data);
    if (!silent) setIsLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    supportApi.getCustomerTickets(token).then((data) => {
      if (!cancelled) {
        setTickets(data);
        setIsLoading(false);
      }
    });

    // Poll for ticket updates every 10 seconds
    const interval = setInterval(() => {
      supportApi.getCustomerTickets(token).then((data) => {
        if (!cancelled) {
          setTickets(data);
        }
      });
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Unclaimed":
        return "bg-secondary-container text-on-secondary-container";
      case "Claimed":
      case "Ongoing":
        return "bg-primary-fixed text-primary";
      case "Completed":
        return "bg-surface-variant text-on-surface-variant";
      case "Canceled":
        return "bg-error-container text-on-error-container";
      default:
        return "bg-surface-container text-on-surface-variant";
    }
  };

  const getCount = (status: string) => {
    if (status === "All") return tickets.length;
    if (status === "Ongoing") {
      return tickets.filter((t) => t.status === "Ongoing" || t.status === "Claimed").length;
    }
    return tickets.filter((t) => t.status === status).length;
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter === "All") return true;
    if (statusFilter === "Ongoing") {
      return ticket.status === "Ongoing" || ticket.status === "Claimed";
    }
    return ticket.status === statusFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/20 pb-5">
        <div>
          <h2 className="font-serif font-bold text-2xl text-primary flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" /> Customer Support Tickets
          </h2>
          <p className="font-sans text-xs text-on-surface-variant mt-1">
            Submit inquiries or track order issues directly with our support staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSubmitDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Open New Ticket
          </button>
        </div>
      </div>

      {/* Status Filters — a dropdown on mobile, pill row on larger screens. */}
      <div>
        {/* Mobile: native select (space-efficient on narrow screens). */}
        <div className="sm:hidden">
          <label htmlFor="ticket-status-filter" className="sr-only">
            Filter tickets by status
          </label>
          <select
            id="ticket-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 text-xs font-semibold rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            {["All", "Unclaimed", "Ongoing", "Completed", "Canceled"].map(
              (status) => (
                <option key={status} value={status}>
                  {status} ({getCount(status)})
                </option>
              )
            )}
          </select>
        </div>

        {/* Desktop: pill-style toggle row. */}
        <div className="hidden sm:flex flex-wrap gap-2 bg-surface-container-low p-1.5 border border-outline-variant/30 w-fit">
          {["All", "Unclaimed", "Ongoing", "Completed", "Canceled"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                statusFilter === status
                  ? "bg-primary text-white shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {status} <span className="opacity-70 ml-1 text-[10px]">({getCount(status)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-on-surface-variant">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          Loading your support tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-10 text-center bg-surface-container-low border border-outline-variant/30 space-y-4">
          <ShieldCheck className="w-12 h-12 text-primary/40 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-on-surface">No support tickets found</h3>
          <p className="font-sans text-xs text-on-surface-variant max-w-sm mx-auto">
            Need help with an order, product, or account inquiry? Submit a ticket or start a live chat session.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsSubmitDialogOpen(true)}
              className="px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-all cursor-pointer"
            >
              Submit a Ticket
            </button>
            {onOpenLiveChat && (
              <button
                onClick={onOpenLiveChat}
                className="px-6 py-2.5 bg-surface-container-lowest border border-outline-variant/40 text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-container transition-all cursor-pointer"
              >
                Chat with Assistant
              </button>
            )}
          </div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant font-medium">
          No tickets found matching the &quot;{statusFilter}&quot; filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-md ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className="font-mono text-[11px] text-on-surface-variant font-semibold">
                    #TK-{ticket.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-base text-on-surface leading-tight">
                  {ticket.title}
                </h4>

                {ticket.description && (
                  <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-outline-variant/10 flex items-center justify-between text-xs text-on-surface-variant">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>

                {ticket.hasStaffReplied && (
                  <Link
                    href={`/support/${ticket.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Message Staff</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Submit Dialog */}
      <TicketSubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        userId={userId}
        onSuccess={() => {
          loadTickets();
        }}
      />
    </div>
  );
}
