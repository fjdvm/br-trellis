"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Loader2 } from "lucide-react";
import { ConversationLayout } from "@/components/features/chat/ConversationLayout";

export function SupportMessengerPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/support");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#451077] mb-2" />
        <p className="text-xs text-slate-500 font-medium">Verifying your session...</p>
      </div>
    );
  }

  return (
    <ConversationLayout>
      <div className="flex flex-col items-center justify-center h-full bg-slate-50/50 text-center px-6">
        <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-[#451077]" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Welcome to Support</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Select a conversation from the sidebar to continue, or create a new ticket to get help from our support team.
        </p>
      </div>
    </ConversationLayout>
  );
}
