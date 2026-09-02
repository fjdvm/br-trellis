"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScheduleType } from "@/types/campaign";

export interface ScheduleState {
  scheduleType: ScheduleType;
  startDate?: string;
  endDate?: string;
}

// Convert an ISO timestamp (from the API) to the value a datetime-local input
// expects (YYYY-MM-DDTHH:mm). Returns undefined for null/invalid input.
export function toLocalInput(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Wizard Schedule step. For Email, choose Send Now or a future date. For
 * Banner/Popup, set the active window (start/end) the promotion runs for.
 */
export function ScheduleStep({
  emailSelected,
  hasStorefrontChannel,
  value,
  onChange,
}: {
  emailSelected: boolean;
  hasStorefrontChannel: boolean;
  value: ScheduleState;
  onChange: (patch: Partial<ScheduleState>) => void;
}) {
  return (
    <div className="space-y-lg">
      {emailSelected && (
        <div className="space-y-sm">
          <Label htmlFor="schedule-type">Email send</Label>
          <Select
            value={value.scheduleType}
            onValueChange={(v) => onChange({ scheduleType: v as ScheduleType })}
          >
            <SelectTrigger id="schedule-type" aria-label="Email send">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SendNow">Send now (on launch)</SelectItem>
              <SelectItem value="Scheduled">Schedule for later</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-md">
        <div className="space-y-sm flex-1">
          <Label htmlFor="start-date">
            {hasStorefrontChannel ? "Active window start" : "Scheduled start"}
          </Label>
          <Input
            id="start-date"
            type="datetime-local"
            value={value.startDate ?? ""}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </div>
        {hasStorefrontChannel && (
          <div className="space-y-sm flex-1">
            <Label htmlFor="end-date">Active window end</Label>
            <Input
              id="end-date"
              type="datetime-local"
              value={value.endDate ?? ""}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Dates are optional for a draft; a Banner/Popup runs for its active window,
        and a scheduled Email sends at its start time once launched.
      </p>
    </div>
  );
}
