"use client";

import { useMemo, useRef, useState } from "react";
import { Mail, PanelTop, AppWindow, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StorefrontLivePreview } from "@/features/campaigns/components/storefront-live-preview";
import {
  BlockTemplateFields,
  NonBlockTemplateFields,
} from "@/features/campaigns/components/channel-form-block-fields";
import { ChannelPerSendFields } from "@/features/campaigns/components/channel-per-send-fields";
import { CHANNEL_ICON } from "@/features/campaigns/helpers/channel-utils";
import { useTemplates } from "@/features/campaigns/hooks/useTemplates";
import type { CampaignChannel } from "@/features/campaigns/types";
import type { BlockContentValue } from "@/features/campaigns/types/block-template";

// Types

export type BlockValue = BlockContentValue;

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
  themeGradient?: "light-to-violet" | "violet-to-light";
  blockValues?: Record<string, BlockValue>;
};

import { useLivePreviewContent } from "@/features/campaigns/components/use-live-preview-content";

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
  const { predefinedTemplates, blockTemplates } = useTemplates(channel);
  const templates = useMemo(
    () => [...predefinedTemplates, ...blockTemplates],
    [predefinedTemplates, blockTemplates]
  );
  const Icon = CHANNEL_ICON[channel];

  const selectedTemplate = templates.find((t) => t.id === value.templateId);
  const isBlockTemplate = selectedTemplate?.format === "Blocks";
  const selectedPredefinedId = predefinedTemplates.some((t) => t.id === value.templateId)
    ? value.templateId ?? ""
    : "";
  const selectedBlockTemplateId = blockTemplates.some((t) => t.id === value.templateId)
    ? value.templateId ?? ""
    : "";

  let parsedBlocks: Array<{
    id: string;
    type: string;
    label: string;
    textAlign?: "left" | "center" | "right";
    isBold?: boolean;
    isItalic?: boolean;
    order?: number;
  }> = [];

  if (isBlockTemplate && selectedTemplate?.content) {
    try {
      const raw = JSON.parse(selectedTemplate.content);
      if (Array.isArray(raw)) {
        parsedBlocks = raw
          .map((b: Record<string, unknown>, idx: number) => ({
            id: (b.id as string) || `block-${idx}`,
            type: (b.type as string) || "text",
            label: (b.label as string) || (b.type as string) || `Block ${idx + 1}`,
            textAlign: (b.textAlign as "left" | "center" | "right") || undefined,
            isBold: (b.isBold as boolean) ?? undefined,
            isItalic: (b.isItalic as boolean) ?? undefined,
            order: (b.order as number) ?? idx,
          }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } catch {
      parsedBlocks = [];
    }
  }

  // When a template is selected, initialise blockValues for every block
  function handleTemplateSelect(templateId: string) {
    const selected = templates.find((t) => t.id === templateId);
    if (!selected) {
      onChange({ templateId });
      return;
    }

    if (selected.format === "Blocks") {
      let blocks: Array<{ id: string; type: string; order?: number }> = [];
      try {
        const raw = JSON.parse(selected.content);
        if (Array.isArray(raw)) {
          blocks = raw.map((b: Record<string, unknown>, idx: number) => ({
            id: (b.id as string) || `block-${idx}`,
            type: (b.type as string) || "text",
            order: (b.order as number) ?? idx,
          }));
        }
      } catch { /**/ }

      const initialBlockValues: Record<string, BlockValue> = {};
      blocks.forEach((block) => {
        if (block.type === "button" || block.type === "link") {
          initialBlockValues[block.id] = { text: "", url: "" };
        } else if (block.type === "image") {
          initialBlockValues[block.id] = { url: "", alt: "" };
        } else if (block.type === "carousel") {
          initialBlockValues[block.id] = [{ imageUrl: "", caption: "", linkUrl: "" }];
        } else {
          initialBlockValues[block.id] = "";
        }
      });

      onChange({ templateId, blockValues: initialBlockValues });
    } else if (channel === "Email") {
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

  function updateBlockValue(blockId: string, newVal: BlockValue) {
    onChange({
      blockValues: {
        ...(value.blockValues ?? {}),
        [blockId]: newVal,
      },
    });
  }

  const livePreviewContent = useLivePreviewContent(isBlockTemplate, parsedBlocks, value);

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

        {/* Pre-defined template picker */}
        <div className="space-y-sm">
          <Label htmlFor={`${channel}-template`}>Template</Label>
          <Select value={selectedPredefinedId} onValueChange={handleTemplateSelect}>
            <SelectTrigger id={`${channel}-template`} aria-label={`${channel} template`}>
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {predefinedTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom (Block) template picker */}
        <div className="space-y-sm">
          <Label htmlFor={`${channel}-custom-template`}>Custom Template</Label>
          <Select value={selectedBlockTemplateId} onValueChange={handleTemplateSelect}>
            <SelectTrigger id={`${channel}-custom-template`} aria-label={`${channel} custom template`}>
              <SelectValue placeholder="Choose a custom template" />
            </SelectTrigger>
            <SelectContent>
              {blockTemplates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ChannelPerSendFields channel={channel} value={value} onChange={onChange} />

        {isBlockTemplate ? (
          <BlockTemplateFields
            channel={channel}
            parsedBlocks={parsedBlocks}
            value={value}
            updateBlockValue={updateBlockValue}
          />
        ) : (
          <NonBlockTemplateFields
            channel={channel}
            value={value}
            onChange={onChange}
          />
        )}
      </div>

      {/* ── Right column: live preview ── */}
      <div className="lg:col-span-5 lg:border-l lg:border-border lg:pl-lg py-lg space-y-4">
        <StorefrontLivePreview
          channel={channel}
          content={livePreviewContent}
          className="sticky top-24"
        />

        {/* Theme Gradient selector for Banner and Popup channels */}
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
