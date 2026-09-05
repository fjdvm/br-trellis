"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { name: "Channels", number: 1 },
  { name: "Audience", number: 2 },
  { name: "Content", number: 3 },
] as const;

export function CampaignStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 bg-card border border-border p-2 rounded-lg shadow-xs overflow-x-auto">
      {PHASES.map((phase, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={phase.name} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : done
                  ? "bg-muted/70 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  active
                    ? "bg-primary-foreground text-primary"
                    : done
                    ? "bg-muted-foreground/20 text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="w-3 h-3 stroke-[3]" /> : phase.number}
              </span>
              <span className="text-xs font-semibold">{phase.name}</span>
            </div>
            {i < PHASES.length - 1 && <span className="w-4 h-0.5 bg-border shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
