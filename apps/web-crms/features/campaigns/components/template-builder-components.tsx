import React from "react";
import { Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type, Image, MousePointerClick, SlidersHorizontal, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlockType } from "@/lib/template-constraints";

export { BannerFixedPreview, BannerBuilderForm, type BannerFields } from "@/features/campaigns/components/banner-builder-components";
export { PopupFixedPreview, PopupBuilderForm, type PopupFields } from "@/features/campaigns/components/popup-builder-components";

export interface TemplateBlock {
  id: string;
  type: BlockType;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
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

