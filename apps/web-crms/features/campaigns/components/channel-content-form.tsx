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
import { useTemplates } from "@/hooks/useTemplates";
import type { CampaignChannel } from "@/types/campaign";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockValue =
  | string
  | { text: string; url: string }
  | { url: string; alt: string }
  | Array<{ imageUrl: string; caption?: string; linkUrl?: string }>;

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

// ---------------------------------------------------------------------------
// Channel icon map
// ---------------------------------------------------------------------------

const CHANNEL_ICON: Record<CampaignChannel, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Banner: PanelTop,
  Popup: AppWindow,
};

// ---------------------------------------------------------------------------
// Helper: render formatted text (markdown bold/italic)
// ---------------------------------------------------------------------------

function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;
  if (/\<[a-z][\s\S]*\>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }
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

// ---------------------------------------------------------------------------
// ChannelContentForm
// ---------------------------------------------------------------------------

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
  const isBlockTemplate = selectedTemplate?.format === "Blocks";

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

  // ---------------------------------------------------------------------------
  // Derive preview content — for block templates, build a JSON body that
  // carries each block's actual user-entered value so the preview renders it.
  // ---------------------------------------------------------------------------
  const livePreviewContent = useMemo(() => {
    if (!isBlockTemplate || parsedBlocks.length === 0) return value;

    const previewBlocks = parsedBlocks.map((block) => ({
      type: block.type,
      label: block.label,
      textAlign: block.textAlign,
      isBold: block.isBold,
      isItalic: block.isItalic,
      content: value.blockValues?.[block.id] ?? "",
    }));

    // Hoist the most relevant values for top-level preview props:
    //   - First heading block → heading
    //   - First text block → body (as JSON block array so preview renders all)
    //   - First button block → ctaText
    //   - First image block → imageUrl
    const firstHeading = parsedBlocks.find((b) => b.type === "heading");
    const firstButton = parsedBlocks.find((b) => b.type === "button");
    const firstImage = parsedBlocks.find((b) => b.type === "image");

    const headingVal =
      firstHeading && typeof value.blockValues?.[firstHeading.id] === "string"
        ? (value.blockValues[firstHeading.id] as string)
        : undefined;

    const btnVal =
      firstButton &&
      value.blockValues?.[firstButton.id] &&
      typeof value.blockValues[firstButton.id] === "object" &&
      !Array.isArray(value.blockValues[firstButton.id]) &&
      "text" in (value.blockValues[firstButton.id] as object)
        ? (value.blockValues[firstButton.id] as { text: string; url: string })
        : null;

    const imgVal =
      firstImage &&
      value.blockValues?.[firstImage.id] &&
      typeof value.blockValues[firstImage.id] === "object" &&
      !Array.isArray(value.blockValues[firstImage.id]) &&
      "url" in (value.blockValues[firstImage.id] as object)
        ? (value.blockValues[firstImage.id] as { url: string; alt: string })
        : null;

    return {
      ...value,
      // The full block list as JSON so the preview renders each one
      body: JSON.stringify(previewBlocks),
      heading: headingVal || value.heading,
      ctaText: btnVal?.text || value.ctaText,
      ctaUrl: btnVal?.url || value.ctaUrl,
      imageUrl: imgVal?.url || value.imageUrl,
    };
  }, [isBlockTemplate, parsedBlocks, value]);

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
          <Select value={value.templateId ?? ""} onValueChange={handleTemplateSelect}>
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

        {/* ── Block template: per-block inputs ── */}
        {isBlockTemplate ? (
          <div className="space-y-6 pt-2">
            {parsedBlocks.map((block, idx) => {
              const val = value.blockValues?.[block.id];

              function update(newVal: BlockValue) {
                updateBlockValue(block.id, newVal);
              }

              const fieldNumber = idx + 1;
              const labelPrefix = `${fieldNumber}. `;

              switch (block.type) {
                // ── text: rich textarea ──
                case "text":
                  return (
                    <RichTextEditorField
                      key={block.id}
                      id={`${channel}-block-${block.id}`}
                      label={labelPrefix + block.label}
                      value={typeof val === "string" ? val : ""}
                      onChange={(v) => update(v)}
                    />
                  );

                // ── heading: plain single-line ──
                case "heading":
                  return (
                    <TextField
                      key={block.id}
                      id={`${channel}-block-${block.id}`}
                      label={labelPrefix + block.label}
                      placeholder="Enter heading text…"
                      value={typeof val === "string" ? val : ""}
                      onChange={(v) => update(v)}
                    />
                  );

                // ── button ──
                case "button": {
                  const bv = (val && typeof val === "object" && !Array.isArray(val) && "text" in val)
                    ? (val as { text: string; url: string })
                    : { text: "", url: "" };
                  return (
                    <BlockGroup key={block.id} label={labelPrefix + block.label} type="button">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SubTextField
                          id={`${channel}-block-${block.id}-text`}
                          label="Button Text"
                          placeholder="e.g. Shop Now"
                          value={bv.text}
                          onChange={(t) => update({ ...bv, text: t })}
                        />
                        <SubTextField
                          id={`${channel}-block-${block.id}-url`}
                          label="Button Link URL"
                          placeholder="https://…"
                          value={bv.url}
                          onChange={(u) => update({ ...bv, url: u })}
                        />
                      </div>
                    </BlockGroup>
                  );
                }

                // ── image ──
                case "image": {
                  const iv = (val && typeof val === "object" && !Array.isArray(val) && "url" in val)
                    ? (val as { url: string; alt: string })
                    : { url: "", alt: "" };
                  return (
                    <BlockGroup key={block.id} label={labelPrefix + block.label} type="image">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SubTextField
                          id={`${channel}-block-${block.id}-url`}
                          label="Image URL"
                          placeholder="https://cdn.example.com/image.jpg"
                          value={iv.url}
                          onChange={(u) => update({ ...iv, url: u })}
                        />
                        <SubTextField
                          id={`${channel}-block-${block.id}-alt`}
                          label="Alt Text"
                          placeholder="Describe the image…"
                          value={iv.alt}
                          onChange={(a) => update({ ...iv, alt: a })}
                        />
                      </div>
                    </BlockGroup>
                  );
                }

                // ── link ──
                case "link": {
                  const lv = (val && typeof val === "object" && !Array.isArray(val) && "text" in val)
                    ? (val as { text: string; url: string })
                    : { text: "", url: "" };
                  return (
                    <BlockGroup key={block.id} label={labelPrefix + block.label} type="link">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <SubTextField
                          id={`${channel}-block-${block.id}-text`}
                          label="Link Text"
                          placeholder="e.g. Learn More"
                          value={lv.text}
                          onChange={(t) => update({ ...lv, text: t })}
                        />
                        <SubTextField
                          id={`${channel}-block-${block.id}-url`}
                          label="Link URL"
                          placeholder="https://…"
                          value={lv.url}
                          onChange={(u) => update({ ...lv, url: u })}
                        />
                      </div>
                    </BlockGroup>
                  );
                }

                // ── carousel ──
                case "carousel": {
                  const slides: Array<{ imageUrl: string; caption?: string; linkUrl?: string }> =
                    Array.isArray(val) && val.length > 0
                      ? (val as Array<{ imageUrl: string; caption?: string; linkUrl?: string }>)
                      : [{ imageUrl: "", caption: "", linkUrl: "" }];

                  function updateSlide(slideIdx: number, field: string, slideVal: string) {
                    const updated = [...slides];
                    updated[slideIdx] = { ...updated[slideIdx], [field]: slideVal };
                    update(updated);
                  }
                  function addSlide() {
                    if (slides.length >= 3) return;
                    update([...slides, { imageUrl: "", caption: "", linkUrl: "" }]);
                  }
                  function removeSlide(slideIdx: number) {
                    if (slides.length <= 1) return;
                    update(slides.filter((_, i) => i !== slideIdx));
                  }

                  return (
                    <BlockGroup key={block.id} label={labelPrefix + block.label} type="carousel">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">
                          {slides.length} of 3 slides
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSlide}
                          disabled={slides.length >= 3}
                          className="gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Slide
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {slides.map((slide, slideIdx) => (
                          <div
                            key={slideIdx}
                            className="p-3 border border-border rounded-md bg-background space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/40 pb-1.5">
                              <span>Slide {slideIdx + 1}</span>
                              {slides.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSlide(slideIdx)}
                                  className="text-destructive hover:underline flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <TextField
                                id={`${channel}-block-${block.id}-slide-${slideIdx}-image`}
                                label="Image URL"
                                placeholder="https://…"
                                value={slide.imageUrl}
                                onChange={(u) => updateSlide(slideIdx, "imageUrl", u)}
                              />
                              <TextField
                                id={`${channel}-block-${block.id}-slide-${slideIdx}-caption`}
                                label="Caption"
                                placeholder="Short caption…"
                                value={slide.caption ?? ""}
                                onChange={(c) => updateSlide(slideIdx, "caption", c)}
                              />
                              <TextField
                                id={`${channel}-block-${block.id}-slide-${slideIdx}-link`}
                                label="Link URL"
                                placeholder="https://…"
                                value={slide.linkUrl ?? ""}
                                onChange={(l) => updateSlide(slideIdx, "linkUrl", l)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </BlockGroup>
                  );
                }

                // ── fallback ──
                default:
                  return (
                    <TextField
                      key={block.id}
                      id={`${channel}-block-${block.id}`}
                      label={labelPrefix + block.label}
                      placeholder="Enter content…"
                      value={typeof val === "string" ? val : ""}
                      onChange={(v) => update(v)}
                    />
                  );
              }
            })}
          </div>
        ) : (
          /* ── Non-block template: channel-specific flat fields ── */
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

// ---------------------------------------------------------------------------
// BlockGroup — wrapper for multi-field blocks
// ---------------------------------------------------------------------------

function BlockGroup({
  label,
  type,
  required,
  children,
}: {
  label: string;
  type: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const typeColors: Record<string, string> = {
    button: "bg-primary/10 text-primary border-primary/20",
    image: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    link: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    carousel: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  const badgeClass = typeColors[type] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="space-y-3 border border-border/70 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}`}>
          {type}
        </span>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------

function TextField({
  id,
  label,
  value,
  required,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-sm border border-border/70 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SubTextField({
  id,
  label,
  value,
  required,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>
      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// RichTextEditorField
// ---------------------------------------------------------------------------

function RichTextEditorField({
  id,
  label,
  value,
  required,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  required?: boolean;
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
      const selectedText = curText.slice(start, end);
      const newText = curText.slice(0, start) + `${wrap}${selectedText}${wrap}` + curText.slice(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + wrap.length, end + wrap.length);
      }, 0);
    } else {
      onChange(curText ? `${curText} ${wrap}text${wrap}` : `${wrap}text${wrap}`);
    }
  }

  return (
    <div className="space-y-sm text-left border border-border/70 rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          {/* Rich Formatting Toolbar */}
          <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 rounded-md">
            <button
              type="button"
              title="Bold"
              onClick={() => { applyFormatting("**"); setIsBold(!isBold); }}
              className={`p-1 rounded transition-colors ${
                isBold ? "bg-background text-primary shadow-xs" : "hover:bg-background text-foreground hover:text-primary"
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic"
              onClick={() => { applyFormatting("*"); setIsItalic(!isItalic); }}
              className={`p-1 rounded transition-colors ${
                isItalic ? "bg-background text-primary shadow-xs" : "hover:bg-background text-foreground hover:text-primary"
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-border mx-0.5" />
            {(
              [
                { align: "left" as const, Icon: AlignLeft },
                { align: "center" as const, Icon: AlignCenter },
                { align: "right" as const, Icon: AlignRight },
              ]
            ).map(({ align, Icon }) => (
              <button
                key={align}
                type="button"
                title={`Align ${align}`}
                onClick={() => setTextAlign(align)}
                className={`p-1 rounded transition-colors ${
                  textAlign === align ? "bg-background text-primary shadow-xs" : "text-foreground hover:bg-background"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
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
