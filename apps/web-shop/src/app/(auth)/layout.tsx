import type { ReactNode } from "react";
import { Providers } from "@/components/shared/Providers";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-[var(--surface)] flex flex-col relative overflow-x-hidden">
        {/* Decorative purple background glow */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)]/5 blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[var(--secondary)]/5 blur-[120px]" />
        </div>

        <main className="flex-grow flex items-center justify-center p-4 sm:p-6 relative z-10">
          {children}
        </main>

        <footer className="relative z-10 py-8 text-center">
          <p className="text-xs text-[var(--muted-foreground)]/60 tracking-wider uppercase">
            © 2024 Bren Raphael&apos;s Ube Jam &amp; Halaya. All rights reserved.
          </p>
        </footer>
      </div>
    </Providers>
  );
}
