"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplates } from "@/hooks/useTemplates";
import type { CampaignChannel } from "@/types/campaign";

export type ChannelContentState = {
  templateId?: string;
  subject?: string;
  heading?: string;
  body?: string;
  imageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  dismissible?: boolean;
};

/**
 * Per-Channel content sub-form used by the CampaignWizard's Content step.
 * The visible fields depend on the Channel:
 *   Email  — Template, Subject, Body, optional banner Image
 *   Banner — Template, Message (Body), Link URL, Dismissible
 *   Popup  — Template, Heading, Message (Body), Image, CTA text + link
 */
export function ChannelContentForm({
  channel,
  value,
  onChange,
}: {
  channel: CampaignChannel;
  value: ChannelContentState;
  onChange: (patch: Partial<ChannelContentState>) => void;
}) {
  const { data: templates } = useTemplates(channel);

  return (
    <div className="space-y-md border border-border rounded-lg p-md">
      <h3 className="text-title-lg font-bold">{channel} Content</h3>

      <div className="space-y-sm">
        <Label htmlFor={`${channel}-template`}>Template</Label>
        <Select value={value.templateId ?? ""} onValueChange={(v) => onChange({ templateId: v })}>
          <SelectTrigger id={`${channel}-template`} aria-label={`${channel} template`}>
            <SelectValue placeholder="Choose a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {channel === "Email" && (
        <>
          <TextField id={`${channel}-subject`} label="Subject" value={value.subject} onChange={(v) => onChange({ subject: v })} />
          <TextAreaField id={`${channel}-body`} label="Body" value={value.body} onChange={(v) => onChange({ body: v })} />
          <TextField id={`${channel}-image`} label="Banner Image URL (optional)" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
        </>
      )}

      {channel === "Banner" && (
        <>
          <TextAreaField id={`${channel}-body`} label="Message" value={value.body} onChange={(v) => onChange({ body: v })} />
          <TextField id={`${channel}-link`} label="Link URL" value={value.linkUrl} onChange={(v) => onChange({ linkUrl: v })} />
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
          <TextField id={`${channel}-heading`} label="Heading" value={value.heading} onChange={(v) => onChange({ heading: v })} />
          <TextAreaField id={`${channel}-body`} label="Message" value={value.body} onChange={(v) => onChange({ body: v })} />
          <TextField id={`${channel}-image`} label="Image URL" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
          <TextField id={`${channel}-cta-text`} label="CTA Text" value={value.ctaText} onChange={(v) => onChange({ ctaText: v })} />
          <TextField id={`${channel}-cta-url`} label="CTA Link URL" value={value.ctaUrl} onChange={(v) => onChange({ ctaUrl: v })} />
        </>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-sm">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-sm">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
