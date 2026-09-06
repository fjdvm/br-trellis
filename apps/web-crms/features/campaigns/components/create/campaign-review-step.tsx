import React from "react";
import type { SegmentListItem } from "@/features/segments";
import type { ScheduleState } from "@/features/campaigns/components/schedule-step";

const NO_SEGMENT = "__none__";

interface CampaignReviewStepProps {
  title: string;
  channels: string[];
  emailSelected: boolean;
  segmentId: string;
  segments: SegmentListItem[];
  presetSegments: SegmentListItem[];
  schedule: ScheduleState;
}

export function CampaignReviewStep({
  title,
  channels,
  emailSelected,
  segmentId,
  segments,
  presetSegments,
  schedule,
}: CampaignReviewStepProps) {
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
                ? [...presetSegments, ...segments].find((s) => s.id === segmentId)?.name ?? segmentId
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
