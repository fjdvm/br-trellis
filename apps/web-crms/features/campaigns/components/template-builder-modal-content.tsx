import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GripVertical,
  Type,
  AlignLeft,
  Image,
  MousePointerClick,
  SlidersHorizontal,
  Link as LinkIcon,
} from "lucide-react";
import {
  BannerFixedPreview,
  PopupFixedPreview,
  BannerBuilderForm,
  PopupBuilderForm,
  EmailBlockCard,
  type TemplateBlock,
  type BannerFields,
  type PopupFields,
} from "@/features/campaigns/components/template-builder-components";
import type { BlockType, ChannelConstraints } from "@/lib/template-constraints";
import type { CampaignChannel } from "@/types/campaign";

interface TemplateBuilderModalContentProps {
  builderChannel: CampaignChannel;
  builderName: string;
  setBuilderName: (v: string) => void;
  builderDescription: string;
  setBuilderDescription: (v: string) => void;
  blocks: TemplateBlock[];
  constraints: ChannelConstraints;
  bannerFields: BannerFields;
  setBannerFields: React.Dispatch<React.SetStateAction<BannerFields>>;
  popupFields: PopupFields;
  setPopupFields: React.Dispatch<React.SetStateAction<PopupFields>>;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  setBuilderError: (msg: string | null) => void;
}

export function TemplateBuilderModalContent({
  builderChannel,
  builderName,
  setBuilderName,
  builderDescription,
  setBuilderDescription,
  blocks,
  constraints,
  bannerFields,
  setBannerFields,
  popupFields,
  setPopupFields,
  addBlock,
  updateBlock,
  removeBlock,
  setBuilderError,
}: TemplateBuilderModalContentProps) {
  if (builderChannel === "Banner") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
        <div className="space-y-5">
          <div className="space-y-3 pb-4 border-b border-border">
            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Template Settings
            </Label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="banner-name" className="text-sm font-semibold">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="banner-name"
                  placeholder="Template name..."
                  value={builderName}
                  onChange={(e) => setBuilderName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner-desc" className="text-sm font-semibold">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="banner-desc"
                  placeholder="Short description..."
                  value={builderDescription}
                  onChange={(e) => setBuilderDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <BannerBuilderForm
            fields={bannerFields}
            onChange={(patch) => setBannerFields((prev) => ({ ...prev, ...patch }))}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            Live Preview
          </Label>
          <BannerFixedPreview fields={bannerFields} />
        </div>
      </div>
    );
  }

  if (builderChannel === "Popup") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
        <div className="space-y-5">
          <div className="space-y-3 pb-4 border-b border-border">
            <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Template Settings
            </Label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="popup-name" className="text-sm font-semibold">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="popup-name"
                  placeholder="Template name..."
                  value={builderName}
                  onChange={(e) => setBuilderName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="popup-desc" className="text-sm font-semibold">
                  Description{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="popup-desc"
                  placeholder="Short description..."
                  value={builderDescription}
                  onChange={(e) => setBuilderDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
          <PopupBuilderForm
            fields={popupFields}
            onChange={(patch) => setPopupFields((prev) => ({ ...prev, ...patch }))}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            Live Preview
          </Label>
          <PopupFixedPreview fields={popupFields} />
        </div>
      </div>
    );
  }

  // Email Builder
  const paletteItems = [
    { type: "carousel" as const, label: "Carousel", icon: SlidersHorizontal, max: constraints.maxCarousel },
    { type: "image" as const, label: "Image Placeholder", icon: Image, max: constraints.maxImages },
    { type: "link" as const, label: "Text Link", icon: LinkIcon, max: constraints.maxLinks },
    { type: "heading" as const, label: "Heading Title", icon: Type, max: constraints.maxHeadings },
    { type: "text" as const, label: "Text Paragraph", icon: AlignLeft, max: constraints.maxTexts },
    { type: "button" as const, label: "CTA Button", icon: MousePointerClick, max: constraints.maxButtons },
  ] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden my-4">
      {/* 1. Palette */}
      <div className="lg:col-span-3 bg-muted/40 border border-border rounded-lg p-4 space-y-4 flex flex-col max-h-[320px] lg:max-h-none lg:min-h-0 overflow-y-auto">
        <div className="space-y-2 shrink-0">
          <Label className="text-xs uppercase font-bold text-muted-foreground">
            Template Settings
          </Label>
          <Input
            placeholder="Template Name..."
            value={builderName}
            onChange={(e) => setBuilderName(e.target.value)}
          />
          <Input
            placeholder="Description (optional)..."
            value={builderDescription}
            onChange={(e) => setBuilderDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          <Label className="text-xs uppercase font-bold text-muted-foreground">
            Draggable Blocks
          </Label>
          <div className="space-y-2">
            {paletteItems
              .filter((item) => item.max > 0)
              .map((item) => {
                const count = blocks.filter((b) => b.type === item.type).length;
                const disabled = count >= item.max;
                return (
                  <div
                    key={item.type}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      if (!disabled) {
                        e.dataTransfer.setData("text/plain", item.type);
                      }
                    }}
                    onClick={() => {
                      if (!disabled) {
                        addBlock(item.type);
                      } else {
                        setBuilderError(`Email allows max ${item.max} ${item.label}(s).`);
                      }
                    }}
                    className={`p-2.5 border rounded-md shadow-xs flex items-center justify-between transition-colors text-xs font-semibold ${
                      disabled
                        ? "bg-muted/40 text-muted-foreground border-border/50 cursor-not-allowed opacity-60"
                        : "bg-background border-border cursor-grab hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-primary shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={count >= item.max ? "destructive" : "secondary"}
                        className="text-[9px] px-1.5 py-0"
                      >
                        {count}/{item.max}
                      </Badge>
                      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 2. Drag and Drop Canvas */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const type = e.dataTransfer.getData("text/plain");
          if (type) addBlock(type as BlockType);
        }}
        className="lg:col-span-6 bg-slate-100 dark:bg-slate-950 border-2 border-dashed border-border rounded-xl p-4 flex flex-col justify-between overflow-y-auto min-h-[380px]"
      >
        <div className="space-y-3">
          <div className="bg-slate-900 text-slate-200 p-2.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="font-mono text-xs text-slate-300 ml-1">
                mail.store-app.com/builder/canvas
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono text-slate-400">
              Block Configurator
            </span>
          </div>

          <div className="bg-background border border-border/80 rounded-xl shadow-md overflow-hidden p-4 w-full text-left space-y-3">
            <div className="space-y-1 text-xs">
              <div className="font-bold text-foreground">
                Subject:{" "}
                <span className="font-normal text-muted-foreground">
                  {builderName || "Campaign Announcement"}
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="font-semibold text-foreground">From:</span> Aura Store
                &lt;newsletter@aurastore.com&gt;
              </div>
            </div>

            <div className="pt-2 border-b border-dashed border-border pb-2">
              <p className="text-[10px] font-mono text-center text-muted-foreground uppercase tracking-wider">
                — Drag &amp; drop blocks to configure —
              </p>
            </div>

            {blocks.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2 border border-dashed border-border/60 rounded-lg">
                <GripVertical className="w-6 h-6 opacity-40 animate-bounce" />
                <p>Drag and drop elements here to compose content</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blocks.map((block) => (
                  <EmailBlockCard
                    key={block.id}
                    block={block}
                    onUpdate={(patch) => updateBlock(block.id, patch)}
                    onRemove={() => removeBlock(block.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" type="button" onClick={() => addBlock("text")}>
            + Add Block
          </Button>
        </div>
      </div>

      {/* 3. Clean Render Preview */}
      <div className="lg:col-span-3 bg-background border border-border rounded-xl p-4 flex flex-col justify-between overflow-y-auto min-h-[380px] shadow-sm">
        <div className="space-y-3">
          <div className="bg-slate-900 text-slate-200 p-2.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="font-mono text-xs text-slate-300 ml-1">Live Render Preview</span>
            </div>
            <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Clean Output
            </span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl shadow-xs p-4 space-y-3 text-left">
            <div className="border-b border-border/60 pb-2 space-y-1">
              <h4 className="font-bold text-sm text-foreground">
                {builderName || "Campaign Announcement"}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Aura Store Marketing &lt;newsletter@aurastore.com&gt;
              </p>
            </div>

            {blocks.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-muted-foreground text-xs border border-dashed rounded-md p-4 text-center">
                No components added yet. Add blocks from the palette to see how they render.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {blocks.map((block) => {
                  const alignClass =
                    block.textAlign === "center"
                      ? "flex flex-col text-center justify-center items-center"
                      : block.textAlign === "right"
                      ? "flex flex-col text-right justify-end items-end"
                      : "flex flex-col text-left justify-start items-start";

                  const fontStyle = `${block.isBold ? "font-bold" : ""} ${block.isItalic ? "italic" : ""}`.trim();

                  if (block.type === "heading") {
                    return (
                      <h3
                        key={block.id}
                        className={`text-base font-bold text-foreground ${alignClass} ${fontStyle}`}
                      >
                        {block.label || "Heading Title"}
                      </h3>
                    );
                  }

                  if (block.type === "text") {
                    return (
                      <p
                        key={block.id}
                        className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap ${alignClass} ${fontStyle}`}
                      >
                        {block.label || "Paragraph text content will render here."}
                      </p>
                    );
                  }

                  if (block.type === "button") {
                    return (
                      <div key={block.id} className={`pt-1 flex ${alignClass}`}>
                        <span className="inline-block py-2 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded shadow-xs cursor-pointer hover:opacity-90 transition-opacity">
                          {block.label || "CTA Action Button"}
                        </span>
                      </div>
                    );
                  }

                  if (block.type === "image") {
                    return (
                      <div
                        key={block.id}
                        className="w-full h-28 bg-muted rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground font-medium border border-dashed border-border gap-1"
                      >
                        <Image className="w-6 h-6 text-primary opacity-80" />
                        <span>{block.label || "Image Component Placeholder"}</span>
                      </div>
                    );
                  }

                  if (block.type === "link") {
                    return (
                      <div
                        key={block.id}
                        className={`text-xs text-primary underline font-medium cursor-pointer ${alignClass}`}
                      >
                        {block.label || "Text Link Anchor"}
                      </div>
                    );
                  }

                  if (block.type === "carousel") {
                    return (
                      <div
                        key={block.id}
                        className="w-full h-24 bg-muted/70 rounded-lg flex items-center justify-center text-xs text-muted-foreground font-semibold border border-dashed border-border gap-2"
                      >
                        <SlidersHorizontal className="w-5 h-5 text-primary opacity-80" />
                        <span>🎠 Carousel ({block.label || "3 Slides"})</span>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
