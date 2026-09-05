import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TextField,
  RichTextEditorField,
} from "@/features/campaigns/components/channel-form-fields";
import type { ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import type { CampaignChannel } from "@/features/campaigns/types";

interface NonBlockTemplateFieldsProps {
  channel: CampaignChannel;
  value: ChannelContentState;
  onChange: (patch: Partial<ChannelContentState>) => void;
}

export function NonBlockTemplateFields({
  channel,
  value,
  onChange,
}: NonBlockTemplateFieldsProps) {
  return (
    <div className="space-y-md pt-2">
      {channel === "Email" && (
        <>
          <TextField
            id={`${channel}-subject`}
            label="Subject"
            placeholder="e.g. Exclusive offer just for you"
            value={value.subject}
            onChange={(v) => onChange({ subject: v })}
          />
          <RichTextEditorField
            id={`${channel}-body`}
            label="Body"
            value={value.body}
            onChange={(v) => onChange({ body: v })}
          />
          <TextField
            id={`${channel}-image`}
            label="Banner Image URL"
            placeholder="https://cdn.example.com/hero.jpg"
            value={value.imageUrl}
            onChange={(v) => onChange({ imageUrl: v })}
          />
        </>
      )}

      {channel === "Banner" && (
        <>
          <RichTextEditorField
            id={`${channel}-body`}
            label="Message"
            value={value.body}
            onChange={(v) => onChange({ body: v })}
          />
          <TextField
            id={`${channel}-image`}
            label="Banner Image URL"
            placeholder="https://cdn.example.com/banner.jpg"
            value={value.imageUrl}
            onChange={(v) => onChange({ imageUrl: v })}
          />
          <TextField
            id={`${channel}-link`}
            label="Link URL"
            placeholder="https://store.example.com/deals"
            value={value.linkUrl}
            onChange={(v) => onChange({ linkUrl: v })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id={`${channel}-dismissible`}
              aria-label="Dismissible"
              checked={value.dismissible ?? false}
              onCheckedChange={(checked) => onChange({ dismissible: checked === true })}
            />
            <span className="text-base">Dismissible</span>
          </label>
        </>
      )}

      {channel === "Popup" && (
        <>
          <TextField
            id={`${channel}-heading`}
            label="Heading"
            placeholder="e.g. Special Announcement"
            value={value.heading}
            onChange={(v) => onChange({ heading: v })}
          />
          <RichTextEditorField
            id={`${channel}-body`}
            label="Message"
            value={value.body}
            onChange={(v) => onChange({ body: v })}
          />
          <TextField
            id={`${channel}-image`}
            label="Image URL"
            placeholder="https://cdn.example.com/popup.jpg"
            value={value.imageUrl}
            onChange={(v) => onChange({ imageUrl: v })}
          />
          <TextField
            id={`${channel}-cta-text`}
            label="CTA Text"
            placeholder="e.g. Shop Now"
            value={value.ctaText}
            onChange={(v) => onChange({ ctaText: v })}
          />
          <TextField
            id={`${channel}-cta-url`}
            label="CTA Link URL"
            placeholder="https://store.example.com/offers"
            value={value.ctaUrl}
            onChange={(v) => onChange({ ctaUrl: v })}
          />
        </>
      )}
    </div>
  );
}
