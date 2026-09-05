import React from "react";
import { PanelTop, Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type, Image, MousePointerClick, SlidersHorizontal, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { BlockType } from "@/lib/template-constraints";

export interface TemplateBlock {
  id: string;
  type: BlockType;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
}

export interface BannerFields {
  message: string;
  imageUrl: string;
  linkUrl: string;
  dismissible: boolean;
}

export interface PopupFields {
  heading: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export function BannerFixedPreview({ fields }: { fields: BannerFields }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-950 p-4 space-y-3">
      <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-400 truncate">
          store.example.com
        </span>
      </div>
      <div className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground rounded-lg px-4 py-3 flex items-center gap-3">
        {fields.imageUrl ? (
          <img
            src={fields.imageUrl}
            alt=""
            className="w-8 h-8 rounded object-cover shrink-0 border border-primary-foreground/20"
          />
        ) : (
          <PanelTop className="w-4 h-4 shrink-0 opacity-80" />
        )}
        <p className="flex-1 text-xs font-medium leading-snug truncate">
          {fields.message || "Your promotional message will appear here…"}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {fields.linkUrl && (
            <span className="text-[11px] font-bold underline bg-primary-foreground/10 px-2 py-1 rounded cursor-pointer">
              Learn More
            </span>
          )}
          {fields.dismissible && (
            <span className="text-primary-foreground/70 text-xs leading-none">✕</span>
          )}
        </div>
      </div>
      <div className="space-y-2 opacity-50">
        <div className="h-4 w-3/4 rounded bg-muted-foreground/20" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded bg-muted/60" />
          <div className="h-14 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

export function PopupFixedPreview({ fields }: { fields: PopupFields }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-950 p-4 space-y-3">
      <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-400 truncate">
          store.example.com
        </span>
      </div>
      <div className="relative rounded-md overflow-hidden">
        <div className="space-y-2 p-3 opacity-40">
          <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 rounded bg-muted/70" />
            <div className="h-12 rounded bg-muted/70" />
          </div>
        </div>
        <div className="absolute inset-0 bg-slate-950/55 rounded-md" />
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <div className="w-full bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3 text-center">
            {fields.imageUrl && (
              <div className="w-full h-16 rounded-lg bg-muted overflow-hidden">
                <img
                  src={fields.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-sm font-bold text-foreground leading-tight">
              {fields.heading || "Popup Heading"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {fields.body || "Your popup body message will appear here…"}
            </p>
            {(fields.ctaText || fields.ctaUrl) && (
              <div className="pt-1">
                <span className="block w-full py-1.5 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
                  {fields.ctaText || "Learn More"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BannerBuilderForm({
  fields,
  onChange,
}: {
  fields: BannerFields;
  onChange: (patch: Partial<BannerFields>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="banner-message" className="text-sm font-semibold">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="banner-message"
          placeholder="e.g. Free shipping on orders over $50 — today only!"
          value={fields.message}
          onChange={(e) => onChange({ message: e.target.value })}
          className="min-h-[80px] resize-none text-base"
        />
        <p className="text-xs text-muted-foreground">
          Keep it short — banners display a single line of text.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="banner-image" className="text-sm font-semibold">
            Image URL{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="banner-image"
            placeholder="https://cdn.example.com/promo.jpg"
            value={fields.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="banner-link" className="text-sm font-semibold">
            Link URL{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="banner-link"
            placeholder="https://store.example.com/deals"
            value={fields.linkUrl}
            onChange={(e) => onChange({ linkUrl: e.target.value })}
          />
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <Checkbox
          id="banner-dismissible"
          checked={fields.dismissible}
          onCheckedChange={(v) => onChange({ dismissible: v === true })}
        />
        <div>
          <span className="text-sm font-semibold">Dismissible</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Show a close button so visitors can hide the banner.
          </p>
        </div>
      </label>
    </div>
  );
}

export function PopupBuilderForm({
  fields,
  onChange,
}: {
  fields: PopupFields;
  onChange: (patch: Partial<PopupFields>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="popup-heading" className="text-sm font-semibold">
          Heading <span className="text-destructive">*</span>
        </Label>
        <Input
          id="popup-heading"
          placeholder="e.g. Exclusive Members-Only Offer"
          value={fields.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="popup-body" className="text-sm font-semibold">
          Body Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="popup-body"
          placeholder="e.g. Get 20% off your next order when you sign up for our newsletter."
          value={fields.body}
          onChange={(e) => onChange({ body: e.target.value })}
          className="min-h-[90px] resize-none text-base"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="popup-image" className="text-sm font-semibold">
          Image URL{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="popup-image"
          placeholder="https://cdn.example.com/popup-hero.jpg"
          value={fields.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Displayed as a hero image at the top of the popup.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="popup-cta-text" className="text-sm font-semibold">
            CTA Button Text
          </Label>
          <Input
            id="popup-cta-text"
            placeholder="e.g. Shop Now"
            value={fields.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="popup-cta-url" className="text-sm font-semibold">
            CTA Link URL
          </Label>
          <Input
            id="popup-cta-url"
            placeholder="https://store.example.com/offers"
            value={fields.ctaUrl}
            onChange={(e) => onChange({ ctaUrl: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function EmailBlockCard({
  block,
  onUpdate,
  onRemove,
}: {
  block: TemplateBlock;
  onUpdate: (patch: Partial<TemplateBlock>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative group bg-card border border-border p-4 rounded-lg shadow-sm space-y-3 text-left">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <Badge variant="outline" className="uppercase text-[10px] font-semibold tracking-wider">
          {block.type}
        </Badge>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Block Label</Label>
        <Input
          placeholder="e.g. Hero Headline, Main Body Text, Action CTA"
          value={block.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="text-sm font-medium"
        />
      </div>

      <div className="flex items-center justify-between bg-muted/50 border border-border p-1.5 rounded-md">
        <div className="flex items-center gap-1">
          {(block.type === "heading" || block.type === "text") && (
            <>
              <button
                type="button"
                title="Bold"
                onClick={() => onUpdate({ isBold: !block.isBold })}
                className={`p-1 rounded text-xs transition-colors ${
                  block.isBold
                    ? "bg-background text-primary shadow-xs font-bold"
                    : "hover:bg-background text-foreground"
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Italic"
                onClick={() => onUpdate({ isItalic: !block.isItalic })}
                className={`p-1 rounded text-xs transition-colors ${
                  block.isItalic
                    ? "bg-background text-primary shadow-xs italic"
                    : "hover:bg-background text-foreground"
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <span className="text-[11px] font-medium text-muted-foreground ml-1">Alignment:</span>
        </div>
        <div className="flex items-center gap-1">
          {(
            [
              { align: "left", Icon: AlignLeft },
              { align: "center", Icon: AlignCenter },
              { align: "right", Icon: AlignRight },
            ] as const
          ).map(({ align, Icon }) => (
            <button
              key={align}
              type="button"
              title={`Align ${align}`}
              onClick={() => onUpdate({ textAlign: align })}
              className={`p-1 px-2 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                (block.textAlign || "left") === align
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:bg-background"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{align}</span>
            </button>
          ))}
        </div>
      </div>

      <BlockTypeIndicator type={block.type} />
    </div>
  );
}

function BlockTypeIndicator({ type }: { type: BlockType }) {
  const map: Record<BlockType, { icon: React.ReactNode; label: string }> = {
    heading: { icon: <Type className="w-4 h-4 text-primary" />, label: "Heading Title Structural Block" },
    text: { icon: <AlignLeft className="w-4 h-4 text-primary" />, label: "Paragraph Text Structural Block" },
    carousel: { icon: <SlidersHorizontal className="w-4 h-4 text-primary" />, label: "Carousel Structural Block (Max 3 images)" },
    image: { icon: <Image className="w-4 h-4 text-primary" />, label: "Image Component Structural Block" },
    link: { icon: <LinkIcon className="w-4 h-4 text-primary" />, label: "Text Link Structural Block" },
    button: { icon: <MousePointerClick className="w-4 h-4 text-primary" />, label: "CTA Button Structural Block" },
  };
  const item = map[type];
  if (!item) return null;
  return (
    <div className="p-3 bg-muted/40 border border-dashed border-border rounded-md text-xs text-muted-foreground font-semibold flex items-center justify-between">
      {item.icon}
      <span>{item.label}</span>
    </div>
  );
}
