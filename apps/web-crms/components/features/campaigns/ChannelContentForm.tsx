"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, PanelTop, AppWindow } from "lucide-react";
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
import { StorefrontLivePreview } from "@/components/features/campaigns/StorefrontLivePreview";
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

const CHANNEL_ICON: Record<CampaignChannel, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Banner: PanelTop,
  Popup: AppWindow,
};

import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

/**
 * Parses markdown bold (**text**) and italic (*text*) into styled React elements.
 */
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;

  // Check if string contains HTML tags from Rich Text Editor
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  // Fallback for markdown syntax (**bold** / *italic*)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

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
  const Icon = CHANNEL_ICON[channel];
  const [animKey, setAnimKey] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
      {/* Form Input Fields (Left Column) */}
      <div className="lg:col-span-7 space-y-md rounded-lg border border-border p-lg">
        <div className="flex items-center gap-2 pb-md border-b border-border">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <h3 className="text-title-lg font-bold text-foreground">{channel} Content</h3>
        </div>

        <div className="space-y-sm">
          <Label htmlFor={`${channel}-template`}>Template</Label>
          <Select
            value={value.templateId ?? ""}
            onValueChange={(v) => {
              const selected = templates.find((t) => t.id === v);
              if (selected) {
                if (channel === "Email") {
                  onChange({
                    templateId: v,
                    subject: value.subject || selected.name,
                    body: value.body || selected.content,
                  });
                } else if (channel === "Banner") {
                  onChange({
                    templateId: v,
                    body: value.body || selected.content,
                    linkUrl: value.linkUrl || "#",
                    dismissible: true,
                  });
                } else if (channel === "Popup") {
                  onChange({
                    templateId: v,
                    heading: value.heading || selected.name,
                    body: value.body || selected.content,
                    ctaText: value.ctaText || "Learn More",
                    ctaUrl: value.ctaUrl || "#",
                  });
                }
              } else {
                onChange({ templateId: v });
              }
            }}
          >
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
            <TextField id={`${channel}-subject`} label="Email Subject" value={value.subject} onChange={(v) => onChange({ subject: v })} />
            <RichTextEditorField id={`${channel}-body`} label="Body Paragraph Text" value={value.body} onChange={(v) => onChange({ body: v })} />
            <TextField id={`${channel}-image`} label="Header / Hero Image URL" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
            <TextField id={`${channel}-cta-text`} label="CTA Button Text" value={value.ctaText} onChange={(v) => onChange({ ctaText: v })} />
            <TextField id={`${channel}-cta-url`} label="CTA Button Link URL" value={value.ctaUrl} onChange={(v) => onChange({ ctaUrl: v })} />
          </>
        )}

        {channel === "Banner" && (
          <>
            <RichTextEditorField id={`${channel}-body`} label="Banner Text / Message" value={value.body} onChange={(v) => onChange({ body: v })} />
            <TextField id={`${channel}-image`} label="Banner Image URL" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
            <TextField id={`${channel}-link`} label="Banner Target Link URL" value={value.linkUrl} onChange={(v) => onChange({ linkUrl: v })} />
            <TextField id={`${channel}-cta-text`} label="CTA Button / Link Label" value={value.ctaText} onChange={(v) => onChange({ ctaText: v })} />
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <Checkbox
                id={`${channel}-dismissible`}
                aria-label="Dismissible"
                checked={value.dismissible ?? false}
                onCheckedChange={(checked) => onChange({ dismissible: checked === true })}
              />
              <span className="text-base font-medium">Dismissible Banner</span>
            </label>
          </>
        )}

        {channel === "Popup" && (
          <>
            <TextField id={`${channel}-heading`} label="Popup Heading Title" value={value.heading} onChange={(v) => onChange({ heading: v })} />
            <RichTextEditorField id={`${channel}-body`} label="Popup Body Message" value={value.body} onChange={(v) => onChange({ body: v })} />
            <TextField id={`${channel}-image`} label="Popup Featured Image URL" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
            <TextField id={`${channel}-cta-text`} label="CTA Button Text" value={value.ctaText} onChange={(v) => onChange({ ctaText: v })} />
            <TextField id={`${channel}-cta-url`} label="CTA Button Target Link URL" value={value.ctaUrl} onChange={(v) => onChange({ ctaUrl: v })} />
          </>
        )}
      </div>

      {/* Live Preview Panel (Right Column) */}
      <div className="lg:col-span-5">
        <StorefrontLivePreview channel={channel} content={value} className="sticky top-24" />
      </div>
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

function RichTextEditorField({
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  function applyFormatting(wrap: "**" | "*") {
    const textarea = textareaRef.current;
    if (!textarea) {
      const cur = value ?? "";
      onChange(cur ? `${cur} ${wrap}text${wrap}` : `${wrap}text${wrap}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const curText = value ?? "";

    if (start !== end) {
      // Format highlighted text selection
      const selectedText = curText.slice(start, end);
      const newText =
        curText.slice(0, start) + `${wrap}${selectedText}${wrap}` + curText.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + wrap.length, end + wrap.length);
      }, 0);
    } else {
      // Fallback: append formatted placeholder
      const newText = curText ? `${curText} ${wrap}text${wrap}` : `${wrap}text${wrap}`;
      onChange(newText);
    }
  }

  return (
    <div className="space-y-sm text-left">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {/* Rich Formatting Toolbar */}
        <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-md">
          <button
            type="button"
            title="Bold"
            onClick={() => {
              applyFormatting("**");
              setIsBold(!isBold);
            }}
            className={`p-1 rounded transition-colors ${
              isBold ? "bg-background text-primary shadow-xs" : "hover:bg-background text-foreground hover:text-primary"
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Italic"
            onClick={() => {
              applyFormatting("*");
              setIsItalic(!isItalic);
            }}
            className={`p-1 rounded transition-colors ${
              isItalic ? "bg-background text-primary shadow-xs" : "hover:bg-background text-foreground hover:text-primary"
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-border mx-0.5" />
          <button
            type="button"
            title="Align Left"
            onClick={() => setTextAlign("left")}
            className={`p-1 rounded transition-colors ${
              textAlign === "left" ? "bg-background text-primary shadow-xs" : "text-foreground hover:bg-background"
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Align Center"
            onClick={() => setTextAlign("center")}
            className={`p-1 rounded transition-colors ${
              textAlign === "center" ? "bg-background text-primary shadow-xs" : "text-foreground hover:bg-background"
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Align Right"
            onClick={() => setTextAlign("right")}
            className={`p-1 rounded transition-colors ${
              textAlign === "right" ? "bg-background text-primary shadow-xs" : "text-foreground hover:bg-background"
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ textAlign, direction: "ltr" }}
        className="min-h-[100px] w-full text-base"
      />
    </div>
  );
}
