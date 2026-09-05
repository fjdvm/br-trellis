import React from "react";
import { Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockContentEditor } from "@/features/campaigns/components/block-content-editor";
import type { BlockType } from "@/features/campaigns/services/template-constraints";
import type { BlockContentValue } from "@/features/campaigns/types/block-template";

export { BannerFixedPreview, BannerBuilderForm, type BannerFields } from "@/features/campaigns/components/banner-builder-components";
export { PopupFixedPreview, PopupBuilderForm, type PopupFields } from "@/features/campaigns/components/popup-builder-components";

export interface TemplateBlock {
  id: string;
  type: BlockType;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  content?: BlockContentValue | null;
}

export function EmailBlockCard({
  block,
  onUpdate,
  onRemove,
  dragHandle,
  isDragging,
}: {
  block: TemplateBlock;
  onUpdate: (patch: Partial<TemplateBlock>) => void;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
  isDragging?: boolean;
}) {
  return (
    <Card
      className={`relative group text-left transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-primary" : "shadow-sm"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <div className="flex items-center gap-2">
            {dragHandle}
            <Badge variant="outline" className="uppercase font-semibold tracking-wider">
              {block.type}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">Block Label</Label>
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
                  className={`p-1 rounded text-sm transition-colors ${
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
                  className={`p-1 rounded text-sm transition-colors ${
                    block.isItalic
                      ? "bg-background text-primary shadow-xs italic"
                      : "hover:bg-background text-foreground"
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <span className="text-sm font-medium text-muted-foreground ml-1">Alignment:</span>
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
                className={`p-1 px-2 rounded text-sm font-medium flex items-center gap-1 transition-colors ${
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

        <BlockContentEditor
          type={block.type}
          idPrefix={`template-block-${block.id}`}
          value={block.content ?? undefined}
          onChange={(content) => onUpdate({ content })}
          label="Content"
        />
      </CardContent>
    </Card>
  );
}


