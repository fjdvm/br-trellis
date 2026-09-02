"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { TicketListSidebar } from "./TicketListSidebar";
import { TicketSubmitDialog } from "@/components/features/profile/TicketSubmitDialog";

interface ConversationLayoutProps {
  activeTicketId?: string;
  children: React.ReactNode;
}

export function ConversationLayout({ activeTicketId, children }: ConversationLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const userId = session?.user?.id;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar (tickets list) — visible on desktop; on mobile the conversation
          uses the back button to return to the full tickets list at /support. */}
      <aside
        className="hidden lg:relative lg:flex lg:w-72 border-r border-slate-200 bg-white"
      >
        <TicketListSidebar
          userId={userId}
          activeTicketId={activeTicketId}
          onOpenNewTicket={() => setIsSubmitDialogOpen(true)}
        />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with back-to-tickets button */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => router.push("/support")}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back to tickets"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-700">Support Conversations</span>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <TicketSubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        userId={userId}
        onSuccess={() => {
          // Stay in the current support path, only close modal
        }}
      />
    </div>
  );
}
