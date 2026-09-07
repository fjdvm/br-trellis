import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "./channel-form-fields";
import type { ChannelContentState } from "./channel-content-form";
import type { CampaignChannel } from "@/features/campaigns/types";

interface ChannelPerSendFieldsProps {
  channel: CampaignChannel;
  value: ChannelContentState;
  onChange: (patch: Partial<ChannelContentState>) => void;
}

export function ChannelPerSendFields({
  channel,
  value,
  onChange,
}: ChannelPerSendFieldsProps) {
  if (channel === "Email") {
    return (
      <TextField
        id={`${channel}-subject`}
        label="Subject"
        placeholder="e.g. Exclusive offer just for you"
        value={value.subject}
        onChange={(v) => onChange({ subject: v })}
      />
    );
  }

  if (channel === "Banner") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          id={`${channel}-dismissible`}
          aria-label="Dismissible"
          checked={value.dismissible ?? false}
          onCheckedChange={(checked) => onChange({ dismissible: checked === true })}
        />
        <span className="text-base">Dismissible</span>
      </label>
    );
  }

  return null;
}
