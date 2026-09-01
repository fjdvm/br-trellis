"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProfileTicketsTab } from "@/components/features/profile/ProfileTicketsTab";
import { Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";

export function SupportClientPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toggleOpen: toggleLiveChat } = useChat();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/support");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="font-sans text-xs text-on-surface-variant">
          Verifying your session, please wait...
        </p>
      </div>
    );
  }

  const userId = session?.user?.id;

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-8 bg-surface font-sans">
      {/* Support Header */}
      <header className="space-y-2 border-b border-outline-variant/30 pb-6">
        <span className="label-upper text-secondary block">
          Artisanal Customer Care
        </span>
        <h1 className="headline-xl font-serif text-primary">
          Support Center
        </h1>
        <p className="body-md text-on-surface-variant max-w-2xl leading-relaxed">
          Manage your inquiries, track order issues, and communicate directly with our artisanal support team.
        </p>
      </header>

      {/* Standalone Support Tickets Hub */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 p-6 sm:p-10 shadow-xs">
        <ProfileTicketsTab userId={userId} onOpenLiveChat={toggleLiveChat} />
      </div>
    </main>
  );
}
