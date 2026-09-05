import React from "react";

export type PreviewBlock = {
  type: string;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  content?:
    | string
    | { text?: string; url?: string }
    | { url?: string; alt?: string }
    | Array<{ imageUrl?: string; caption?: string; linkUrl?: string }>;
};

// Mirrors apps/api-crms/Helpers/EmailBodyRenderer.cs's slide loop: one block per
// slide (image, optional caption, optional "Learn More" link) stacked top to
// bottom. Real emails can't reliably support interactive carousels, so there is
// no active-slide state, no arrows, no dots — keep this in sync with that renderer.
export function StackedImagesBlock({
  block,
  slides,
  alignClass,
}: {
  block: PreviewBlock;
  slides: Array<{ imageUrl?: string; caption?: string; linkUrl?: string }>;
  alignClass: string;
}) {
  const filledSlides = slides.filter((s) => s.imageUrl?.trim());

  if (filledSlides.length === 0) {
    return (
      <div
        className={`w-full h-32 bg-muted/60 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground font-semibold ${alignClass}`}
      >
        🖼️ {block.label}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {filledSlides.map((slide, i) => (
        <div
          key={i}
          className="w-full rounded-lg overflow-hidden border border-border shadow-xs bg-card"
        >
          <img
            src={slide.imageUrl}
            alt={slide.caption || `Slide ${i + 1}`}
            className="w-full h-44 object-cover"
          />
          {slide.caption && (
            <p className="p-2 bg-card text-xs text-center text-foreground font-medium border-t border-border">
              {slide.caption}
            </p>
          )}
          {slide.linkUrl && (
            <p className="px-2 pb-2 text-center text-xs">
              <a href={slide.linkUrl} className="text-primary underline font-medium">
                Learn More
              </a>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
