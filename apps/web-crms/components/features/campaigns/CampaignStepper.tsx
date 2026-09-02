import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// The 3-phase horizontal stepper (Channels / Audience / Content) shown in the
// campaign create/edit wireframe header. `current` is the active phase index.
const PHASES = ["Channels", "Audience", "Content"] as const;

export function CampaignStepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
      {PHASES.map((phase, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                  active
                    ? "bg-primary-foreground text-primary"
                    : done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className="text-sm font-semibold">{phase}</span>
            </div>
            {i < PHASES.length - 1 && <span className="w-4 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
