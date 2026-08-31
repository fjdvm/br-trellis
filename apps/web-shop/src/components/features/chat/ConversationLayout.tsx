"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { TicketListSidebar } from "./TicketListSidebar";
import { TicketSubmitDialog } from "@/components/features/profile/TicketSubmitDialog";

interface ConversationLayoutProps {
  activeTicketId?: string;
  children: React.ReactNode;
}

export function ConversationLayout({ activeTicketId, children }: ConversationLayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  const userId = session?.user?.id;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 top-[64px] z-40 w-72 border-r border-slate-200 bg-white
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:top-0 lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <TicketListSidebar
          userId={userId}
          activeTicketId={activeTicketId}
          onOpenNewTicket={() => setIsSubmitDialogOpen(true)}
        />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open conversations"
          >
            <Menu className="w-5 h-5" />
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
