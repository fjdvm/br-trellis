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
  blockValues?: Record<string, any>;
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

  const selectedTemplate = templates.find((t) => t.id === value.templateId);
  const isBlockTemplate = selectedTemplate?.format === "Blocks";

  let parsedBlocks: any[] = [];
  if (isBlockTemplate && selectedTemplate?.content) {
    try {
      parsedBlocks = JSON.parse(selectedTemplate.content);
    } catch (e) {
      parsedBlocks = [];
    }
  }

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
                if (selected.format === "Blocks") {
                  let initialBlocks: any[] = [];
                  try {
                    initialBlocks = JSON.parse(selected.content);
                  } catch (e) {}

                  const initialBlockValues: Record<string, any> = {};
                  initialBlocks.forEach((block: any, idx: number) => {
                    const blockId = block.id || `block-${idx}`;
                    if (block.type === "button") {
                      initialBlockValues[blockId] = { text: "", url: "" };
                    } else if (block.type === "image") {
                      initialBlockValues[blockId] = { url: "", alt: "" };
                    } else if (block.type === "link") {
                      initialBlockValues[blockId] = { text: "", url: "" };
                    } else if (block.type === "carousel") {
                      initialBlockValues[blockId] = [{ imageUrl: "", caption: "", linkUrl: "" }];
                    } else {
                      initialBlockValues[blockId] = "";
                    }
                  });

                  onChange({
                    templateId: v,
                    blockValues: initialBlockValues,
                  });
                } else if (channel === "Email") {
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

        {isBlockTemplate ? (
          <div className="space-y-4 pt-2">
            {parsedBlocks
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((block, idx) => {
                const blockId = block.id || `block-${idx}`;
                const val = value.blockValues?.[blockId];
                const updateBlockValue = (newVal: any) => {
                  onChange({
                    blockValues: {
                      ...(value.blockValues ?? {}),
                      [blockId]: newVal,
                    },
                  });
                };

                switch (block.type) {
                  case "text":
                    return (
                      <RichTextEditorField
                        key={blockId}
                        id={`${channel}-block-${blockId}`}
                        label={block.label || "Text Block"}
                        value={typeof val === "string" ? val : ""}
                        onChange={updateBlockValue}
                      />
                    );
                  case "heading":
                    return (
                      <TextField
                        key={blockId}
                        id={`${channel}-block-${blockId}`}
                        label={block.label || "Heading"}
                        value={typeof val === "string" ? val : ""}
                        onChange={updateBlockValue}
                      />
                    );
                  case "button":
                    return (
                      <div key={blockId} className="space-y-sm border border-border/80 rounded-md p-3 bg-muted/20">
                        <Label className="font-semibold text-sm">{block.label || "Button Block"}</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <TextField
                            id={`${channel}-block-${blockId}-text`}
                            label="Button Text"
                            value={val?.text ?? ""}
                            onChange={(t) => updateBlockValue({ ...val, text: t })}
                          />
                          <TextField
                            id={`${channel}-block-${blockId}-url`}
                            label="Button Link URL"
                            value={val?.url ?? ""}
                            onChange={(u) => updateBlockValue({ ...val, url: u })}
                          />
                        </div>
                      </div>
                    );
                  case "image":
                    return (
                      <div key={blockId} className="space-y-sm border border-border/80 rounded-md p-3 bg-muted/20">
                        <Label className="font-semibold text-sm">{block.label || "Image Block"}</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <TextField
                            id={`${channel}-block-${blockId}-url`}
                            label="Image URL"
                            value={val?.url ?? ""}
                            onChange={(u) => updateBlockValue({ ...val, url: u })}
                          />
                          <TextField
                            id={`${channel}-block-${blockId}-alt`}
                            label="Alt Text"
                            value={val?.alt ?? ""}
                            onChange={(a) => updateBlockValue({ ...val, alt: a })}
                          />
                        </div>
                      </div>
                    );
                  case "link":
                    return (
                      <div key={blockId} className="space-y-sm border border-border/80 rounded-md p-3 bg-muted/20">
                        <Label className="font-semibold text-sm">{block.label || "Link Block"}</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <TextField
                            id={`${channel}-block-${blockId}-text`}
                            label="Link Text"
                            value={val?.text ?? ""}
                            onChange={(t) => updateBlockValue({ ...val, text: t })}
                          />
                          <TextField
                            id={`${channel}-block-${blockId}-url`}
                            label="Link URL"
                            value={val?.url ?? ""}
                            onChange={(u) => updateBlockValue({ ...val, url: u })}
                          />
                        </div>
                      </div>
                    );
                  case "carousel": {
                    const slides: Array<{ imageUrl: string; caption?: string; linkUrl?: string }> =
                      Array.isArray(val) && val.length > 0
                        ? val
                        : [{ imageUrl: "", caption: "", linkUrl: "" }];

                    const updateSlide = (slideIdx: number, field: string, slideVal: string) => {
                      const updated = [...slides];
                      updated[slideIdx] = { ...updated[slideIdx], [field]: slideVal };
                      updateBlockValue(updated);
                    };

                    const addSlide = () => {
                      updateBlockValue([...slides, { imageUrl: "", caption: "", linkUrl: "" }]);
                    };

                    const removeSlide = (slideIdx: number) => {
                      if (slides.length <= 1) return;
                      updateBlockValue(slides.filter((_, i) => i !== slideIdx));
                    };

                    return (
                      <div key={blockId} className="space-y-sm border border-border/80 rounded-md p-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-sm">{block.label || "Carousel Component"}</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addSlide}>
                            + Add Slide
                          </Button>
                        </div>
                        <div className="space-y-3 pt-1">
                          {slides.map((slide, slideIdx) => (
                            <div key={slideIdx} className="p-3 border border-border rounded bg-background space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/40 pb-1">
                                <span>Slide #{slideIdx + 1}</span>
                                {slides.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSlide(slideIdx)}
                                    className="text-destructive hover:underline"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <TextField
                                  id={`${channel}-block-${blockId}-slide-${slideIdx}-image`}
                                  label="Image URL"
                                  value={slide.imageUrl}
                                  onChange={(u) => updateSlide(slideIdx, "imageUrl", u)}
                                />
                                <TextField
                                  id={`${channel}-block-${blockId}-slide-${slideIdx}-caption`}
                                  label="Caption"
                                  value={slide.caption ?? ""}
                                  onChange={(c) => updateSlide(slideIdx, "caption", c)}
                                />
                                <TextField
                                  id={`${channel}-block-${blockId}-slide-${slideIdx}-link`}
                                  label="Link URL"
                                  value={slide.linkUrl ?? ""}
                                  onChange={(l) => updateSlide(slideIdx, "linkUrl", l)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  default:
                    return (
                      <TextField
                        key={blockId}
                        id={`${channel}-block-${blockId}`}
                        label={block.label || block.type}
                        value={typeof val === "string" ? val : ""}
                        onChange={updateBlockValue}
                      />
                    );
                }
              })}
          </div>
        ) : (
          <>
            {channel === "Email" && (
              <>
                <TextField id={`${channel}-subject`} label="Subject" value={value.subject} onChange={(v) => onChange({ subject: v })} />
                <RichTextEditorField id={`${channel}-body`} label="Body" value={value.body} onChange={(v) => onChange({ body: v })} />
                <TextField id={`${channel}-image`} label="Banner Image URL (optional)" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
              </>
            )}

            {channel === "Banner" && (
              <>
                <RichTextEditorField id={`${channel}-body`} label="Message" value={value.body} onChange={(v) => onChange({ body: v })} />
                <TextField id={`${channel}-image`} label="Banner Image URL (optional)" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
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
                <RichTextEditorField id={`${channel}-body`} label="Message" value={value.body} onChange={(v) => onChange({ body: v })} />
                <TextField id={`${channel}-image`} label="Image URL" value={value.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
                <TextField id={`${channel}-cta-text`} label="CTA Text" value={value.ctaText} onChange={(v) => onChange({ ctaText: v })} />
                <TextField id={`${channel}-cta-url`} label="CTA Link URL" value={value.ctaUrl} onChange={(v) => onChange({ ctaUrl: v })} />
              </>
            )}
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
