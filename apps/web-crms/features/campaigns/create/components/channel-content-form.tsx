"use client";

import { useEffect } from "react";
import { Mail, PanelTop, AppWindow } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StorefrontLivePreview } from "../../create/components/storefront-live-preview";
import { NonBlockTemplateFields } from "./non-block-template-fields";
import { ChannelPerSendFields } from "./channel-per-send-fields";
import { CHANNEL_ICON } from "@/features/campaigns/helpers/channel-utils";
import { useTemplates } from "../../list/hooks/useTemplates";
import type { CampaignChannel } from "@/features/campaigns/types";

// Types

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
  // Banner/Popup mock-preview-only gradient; unrelated to any Template rendering.
  themeGradient?: "light-to-violet" | "violet-to-light";
};

// ChannelContentForm

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

  const selectedTemplate = templates.find((t) => t.id === value.templateId);
  const selectedTemplateId = selectedTemplate ? value.templateId ?? "" : "";

  // When a template is selected, seed the channel's fields from its content.
  function handleTemplateSelect(templateId: string) {
    const selected = templates.find((t) => t.id === templateId);
    if (!selected) {
      onChange({ templateId });
      return;
    }

    if (channel === "Email") {
      onChange({
        templateId,
        subject: value.subject || selected.name,
        body: value.body || selected.content,
      });
    } else if (channel === "Banner") {
      onChange({
        templateId,
        body: value.body || selected.content,
        linkUrl: value.linkUrl || "#",
        dismissible: true,
      });
    } else if (channel === "Popup") {
      onChange({
        templateId,
        heading: value.heading || selected.name,
        body: value.body || selected.content,
        ctaText: value.ctaText || "Learn More",
        ctaUrl: value.ctaUrl || "#",
      });
    }
  }

  // Auto-populate a templateId that arrived with no fields set yet, without re-running on reload.
  useEffect(() => {
    if (!value.templateId) return;
    const hasContent =
      channel === "Banner"
        ? Boolean(value.body)
        : channel === "Popup"
        ? Boolean(value.heading || value.body)
        : Boolean(value.subject || value.body);
    if (!hasContent) {
      handleTemplateSelect(value.templateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.templateId, templates]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch">
      {/* ── Left column: form ── */}
      <div className="lg:col-span-7 space-y-md p-lg">
        {/* Channel header */}
        <div className="flex items-center gap-2 pb-md border-b border-border">
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            <Icon className="w-4 h-4 text-foreground" />
          </div>
          <h3 className="text-title-lg font-bold text-foreground">{channel} Content</h3>
        </div>

        {/* Template picker */}
        <div className="space-y-sm">
          <Label htmlFor={`${channel}-template`}>Template</Label>
          <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
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

        <ChannelPerSendFields channel={channel} value={value} onChange={onChange} />

        <NonBlockTemplateFields channel={channel} value={value} onChange={onChange} />
      </div>

      {/* ── Right column: live preview ── */}
      <div className="lg:col-span-5 lg:border-l lg:border-border lg:pl-lg py-lg space-y-4">
        <StorefrontLivePreview
          channel={channel}
          content={value}
          className="sticky top-24"
        />

        {/* Theme Gradient selector for Banner and Popup channels - mock-preview-only. */}
        {(channel === "Banner" || channel === "Popup") && (
          <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2 text-left">
            <Label className="text-xs font-semibold text-foreground block">
              {channel} Theme Gradient
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ themeGradient: "light-to-violet" })}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  (value.themeGradient ?? "light-to-violet") === "light-to-violet"
                    ? "border-primary ring-2 ring-primary/40 bg-background shadow-xs"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                <div className="w-full h-6 rounded bg-gradient-to-r from-violet-100 via-purple-200 to-violet-700 border border-border/40 flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold text-slate-900">Text</span>
                  <span className="text-[8px] font-bold text-white uppercase">Violet</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Light to Violet</span>
                  <span className="text-[10px] text-muted-foreground block">Light bg · Dark text</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onChange({ themeGradient: "violet-to-light" })}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                  value.themeGradient === "violet-to-light"
                    ? "border-primary ring-2 ring-primary/40 bg-background shadow-xs"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                <div className="w-full h-6 rounded bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-100 border border-border/40 flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold text-white">Text</span>
                  <span className="text-[8px] font-bold text-slate-900 uppercase">Light</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">Violet to Light</span>
                  <span className="text-[10px] text-muted-foreground block">Dark bg · Light text</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
