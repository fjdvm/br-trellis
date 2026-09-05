import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BlockGroup,
  TextField,
  SubTextField,
  RichTextEditorField,
} from "@/features/campaigns/components/channel-form-fields";
import type { BlockValue, ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import type { CampaignChannel } from "@/features/campaigns/types";

export interface ParsedBlock {
  id: string;
  type: string;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  order?: number;
}

interface BlockTemplateFieldsProps {
  channel: CampaignChannel;
  parsedBlocks: ParsedBlock[];
  value: ChannelContentState;
  updateBlockValue: (blockId: string, newVal: BlockValue) => void;
}

export function BlockTemplateFields({
  channel,
  parsedBlocks,
  value,
  updateBlockValue,
}: BlockTemplateFieldsProps) {
  return (
    <div className="space-y-6 pt-2">
      {parsedBlocks.map((block, idx) => {
        const val = value.blockValues?.[block.id];

        function update(newVal: BlockValue) {
          updateBlockValue(block.id, newVal);
        }

        const fieldNumber = idx + 1;
        const labelPrefix = `${fieldNumber}. `;

        switch (block.type) {
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

          case "button": {
            const bv =
              val && typeof val === "object" && !Array.isArray(val) && "text" in val
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

          case "image": {
            const iv =
              val && typeof val === "object" && !Array.isArray(val) && "url" in val
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

          case "link": {
            const lv =
              val && typeof val === "object" && !Array.isArray(val) && "text" in val
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
  );
}

export { NonBlockTemplateFields } from "@/features/campaigns/components/non-block-template-fields";

