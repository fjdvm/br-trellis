import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubTextField, TextField, RichTextEditorField } from "@/features/campaigns/components/channel-form-fields";
import type { BlockContentValue } from "@/features/campaigns/types/block-template";

type CarouselSlide = { imageUrl: string; caption?: string; linkUrl?: string };

// The single, shared per-block-type content editor. Used by both the reusable
// Template Builder (EmailBlockCard) and the campaign composer's block content
// form (BlockTemplateFields) so the two never drift into rendering/serializing
// content differently from one another.
export function BlockContentEditor({
  type,
  idPrefix,
  value,
  onChange,
  label,
}: {
  type: string;
  idPrefix: string;
  value: BlockContentValue | undefined;
  onChange: (v: BlockContentValue) => void;
  label?: string;
}) {
  switch (type) {
    case "heading":
      return (
        <TextField
          id={`${idPrefix}-content`}
          label={label ?? "Heading Text"}
          placeholder="Enter heading text…"
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );

    case "text":
      return (
        <RichTextEditorField
          id={`${idPrefix}-content`}
          label={label ?? "Text Content"}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );

    case "button":
    case "link": {
      const v =
        value && typeof value === "object" && !Array.isArray(value) && "text" in value
          ? (value as { text: string; url: string })
          : { text: "", url: "" };
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SubTextField
            id={`${idPrefix}-text`}
            label={type === "button" ? "Button Text" : "Link Text"}
            placeholder={type === "button" ? "e.g. Shop Now" : "e.g. Learn More"}
            value={v.text}
            onChange={(t) => onChange({ ...v, text: t })}
          />
          <SubTextField
            id={`${idPrefix}-url`}
            label={type === "button" ? "Button Link URL" : "Link URL"}
            placeholder="https://…"
            value={v.url}
            onChange={(u) => onChange({ ...v, url: u })}
          />
        </div>
      );
    }

    case "image": {
      const v =
        value && typeof value === "object" && !Array.isArray(value) && "url" in value
          ? (value as { url: string; alt: string })
          : { url: "", alt: "" };
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SubTextField
            id={`${idPrefix}-url`}
            label="Image URL"
            placeholder="https://cdn.example.com/image.jpg"
            value={v.url}
            onChange={(u) => onChange({ ...v, url: u })}
          />
          <SubTextField
            id={`${idPrefix}-alt`}
            label="Alt Text"
            placeholder="Describe the image…"
            value={v.alt}
            onChange={(a) => onChange({ ...v, alt: a })}
          />
        </div>
      );
    }

    case "carousel": {
      const slides: CarouselSlide[] =
        Array.isArray(value) && value.length > 0 ? (value as CarouselSlide[]) : [{ imageUrl: "", caption: "", linkUrl: "" }];

      function updateSlide(slideIdx: number, field: keyof CarouselSlide, slideVal: string) {
        const updated = [...slides];
        updated[slideIdx] = { ...updated[slideIdx], [field]: slideVal };
        onChange(updated);
      }
      function addSlide() {
        if (slides.length >= 3) return;
        onChange([...slides, { imageUrl: "", caption: "", linkUrl: "" }]);
      }
      function removeSlide(slideIdx: number) {
        if (slides.length <= 1) return;
        onChange(slides.filter((_, i) => i !== slideIdx));
      }

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{slides.length} of 3 slides</span>
            <Button type="button" variant="outline" size="sm" onClick={addSlide} disabled={slides.length >= 3} className="gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add Slide
            </Button>
          </div>
          {slides.map((slide, slideIdx) => (
            <div key={slideIdx} className="p-3 border border-border rounded-md bg-background space-y-2">
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
                  id={`${idPrefix}-slide-${slideIdx}-image`}
                  label="Image URL"
                  placeholder="https://…"
                  value={slide.imageUrl}
                  onChange={(u) => updateSlide(slideIdx, "imageUrl", u)}
                />
                <TextField
                  id={`${idPrefix}-slide-${slideIdx}-caption`}
                  label="Caption"
                  placeholder="Short caption…"
                  value={slide.caption ?? ""}
                  onChange={(c) => updateSlide(slideIdx, "caption", c)}
                />
                <TextField
                  id={`${idPrefix}-slide-${slideIdx}-link`}
                  label="Link URL"
                  placeholder="https://…"
                  value={slide.linkUrl ?? ""}
                  onChange={(l) => updateSlide(slideIdx, "linkUrl", l)}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return (
        <TextField
          id={`${idPrefix}-content`}
          label={label ?? "Content"}
          placeholder="Enter content…"
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      );
  }
}
