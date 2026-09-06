"use client";

import {
  SYSTEM_PRESET_SEGMENTS,
} from "@/features/campaigns/components/step2-audience";
import type { SegmentListItem } from "@/features/segments";
import type { CampaignChannel } from "@/features/campaigns/types";
import type { ScheduleState } from "@/features/campaigns/components/schedule-step";

const NO_SEGMENT = "__none__";

export interface StepReviewProps {
  title: string;
  channels: CampaignChannel[];
  emailSelected: boolean;
  segmentId: string;
  segments: SegmentListItem[];
  schedule: ScheduleState;
}

export function StepReview({
  title,
  channels,
  emailSelected,
  segmentId,
  segments,
  schedule,
}: StepReviewProps) {
  return (
    <div className="space-y-md">
      <h3 className="text-headline-md font-bold text-foreground">
        Review Campaign Configuration
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md bg-muted/30 p-md rounded-lg text-base">
        <div>
          <span className="text-muted-foreground block font-medium">Campaign Title</span>
          <span className="font-semibold text-foreground">{title || "—"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block font-medium">Selected Channels</span>
          <span className="font-semibold text-foreground">
            {channels.join(", ") || "None"}
          </span>
        </div>
        {emailSelected && (
          <div>
            <span className="text-muted-foreground block font-medium">Target Audience</span>
            <span className="font-semibold text-foreground">
              {segmentId !== NO_SEGMENT
                ? [...SYSTEM_PRESET_SEGMENTS, ...segments].find((s) => s.id === segmentId)?.name ?? segmentId
                : "Custom email addresses"}
            </span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground block font-medium">Schedule</span>
          <span className="font-semibold text-foreground">
            {schedule.scheduleType === "SendNow"
              ? "Send Immediately"
              : `Scheduled (${schedule.startDate || "TBD"} – ${
                  schedule.endDate || "No end date"
                })`}
          </span>
        </div>
      </div>

      <p className="text-base text-muted-foreground">
        Clicking <strong>Save Draft</strong> creates a pending draft campaign. You can preview,
        test, and launch it whenever you are ready.
      </p>
    </div>
  );
}
