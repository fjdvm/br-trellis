"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface CancelTicketModalProps {
  isOpen: boolean;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelTicketModal({
  isOpen,
  isCancelling,
  onClose,
  onConfirm,
}: CancelTicketModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Cancel Support Ticket?</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Are you sure you want to cancel this ticket? Once cancelled, staff will no longer process your inquiry and you will need to open a new ticket.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isCancelling}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
          >
            Keep Ticket
          </button>
          <button
            onClick={onConfirm}
            disabled={isCancelling}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes, Cancel Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
