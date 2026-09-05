import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export function CarouselBlock({
  block,
  slides,
  alignClass,
}: {
  block: PreviewBlock;
  slides: Array<{ imageUrl?: string; caption?: string; linkUrl?: string }>;
  alignClass: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const filledSlides = slides.filter((s) => s.imageUrl?.trim());

  if (filledSlides.length === 0) {
    return (
      <div
        className={`w-full h-32 bg-muted/60 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground font-semibold ${alignClass}`}
      >
        🎠 {block.label}
      </div>
    );
  }

  const currentSlide = filledSlides[activeIndex] ?? filledSlides[0];

  function prevSlide() {
    setActiveIndex((i) => (i === 0 ? filledSlides.length - 1 : i - 1));
  }
  function nextSlide() {
    setActiveIndex((i) => (i === filledSlides.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="relative group w-full rounded-lg overflow-hidden border border-border shadow-xs bg-card">
      <div className="relative w-full h-44 bg-muted">
        <img
          src={currentSlide.imageUrl}
          alt={currentSlide.caption || `Slide ${activeIndex + 1}`}
          className="w-full h-full object-cover"
        />
        {filledSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        {filledSlides.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10">
            {filledSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>
      {currentSlide.caption && (
        <div className="p-2 bg-card text-xs text-center text-foreground font-medium border-t border-border">
          {currentSlide.caption}
        </div>
      )}
    </div>
  );
}
