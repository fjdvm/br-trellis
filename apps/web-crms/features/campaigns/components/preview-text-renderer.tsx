import { CarouselBlock, type PreviewBlock } from "@/features/campaigns/components/carousel-block";

export { CarouselBlock, type PreviewBlock };


export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;

  if (text.trim().startsWith("[") && text.trim().endsWith("]")) {
    try {
      const parsed: PreviewBlock[] = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
        return (
          <div className="space-y-2">
            {parsed.map((block, idx) => {
              const alignClass =
                block.textAlign === "center"
                  ? "flex flex-col text-center justify-center items-center"
                  : block.textAlign === "right"
                  ? "flex flex-col text-right justify-end items-end"
                  : "flex flex-col text-left justify-start items-start";

              const textStyle = `${block.isBold ? "font-bold" : ""} ${block.isItalic ? "italic" : ""}`.trim();

              if (block.type === "heading") {
                const display =
                  typeof block.content === "string" && block.content.trim()
                    ? block.content
                    : block.label;
                return (
                  <div
                    key={idx}
                    className={`font-bold text-foreground text-sm ${alignClass} ${textStyle}`}
                  >
                    {display}
                  </div>
                );
              }

              if (block.type === "text") {
                const display =
                  typeof block.content === "string" && block.content.trim()
                    ? block.content
                    : block.label;
                return (
                  <div
                    key={idx}
                    className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap ${alignClass} ${textStyle}`}
                  >
                    {display}
                  </div>
                );
              }

              if (block.type === "button") {
                const bv =
                  block.content &&
                  typeof block.content === "object" &&
                  !Array.isArray(block.content) &&
                  "text" in block.content
                    ? (block.content as { text?: string; url?: string })
                    : null;
                const label = bv?.text?.trim() || block.label;
                return (
                  <div key={idx} className={`pt-1 flex ${alignClass}`}>
                    <span className="inline-block py-1.5 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded shadow-xs">
                      {label}
                    </span>
                  </div>
                );
              }

              if (block.type === "image") {
                const iv =
                  block.content &&
                  typeof block.content === "object" &&
                  !Array.isArray(block.content) &&
                  "url" in block.content
                    ? (block.content as { url?: string; alt?: string })
                    : null;
                const src = iv?.url?.trim();
                if (src) {
                  return (
                    <div key={idx} className="w-full">
                      <img
                        src={src}
                        alt={iv?.alt || block.label}
                        className="w-full h-48 object-cover rounded-lg shadow-xs"
                      />
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className={`w-full h-32 bg-muted/60 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground font-semibold ${alignClass}`}
                  >
                    📷 {block.label}
                  </div>
                );
              }

              if (block.type === "carousel") {
                const slides = Array.isArray(block.content) ? block.content : [];
                return <CarouselBlock key={idx} block={block} slides={slides} alignClass={alignClass} />;
              }

              if (block.type === "link") {
                const lv =
                  block.content &&
                  typeof block.content === "object" &&
                  !Array.isArray(block.content) &&
                  "text" in block.content
                    ? (block.content as { text?: string; url?: string })
                    : null;
                const label = lv?.text?.trim() || block.label;
                return (
                  <div key={idx} className={`text-xs text-primary underline font-medium ${alignClass}`}>
                    {label}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`text-xs text-muted-foreground leading-relaxed ${alignClass} ${textStyle}`}
                >
                  {typeof block.content === "string" && block.content.trim()
                    ? block.content
                    : block.label}
                </div>
              );
            })}
          </div>
        );
      }
    } catch {
      // fall through
    }
  }

  if (text.trim().startsWith("{") && text.trim().endsWith("}")) {
    try {
      const parsedDict = JSON.parse(text);
      if (typeof parsedDict === "object" && parsedDict !== null && !Array.isArray(parsedDict)) {
        const entries = Object.entries(parsedDict);
        if (entries.length > 0) {
          return (
            <div className="space-y-3">
              {entries.map(([key, val], idx) => {
                if (val === null || val === undefined) return null;

                if (typeof val === "string") {
                  if (!val.trim()) return null;
                  return (
                    <div key={key || idx} className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {val}
                    </div>
                  );
                }

                if (Array.isArray(val)) {
                  const slides = val as Array<{ imageUrl?: string; caption?: string; linkUrl?: string }>;
                  return (
                    <CarouselBlock
                      key={key || idx}
                      block={{ type: "carousel", label: "Carousel", content: slides }}
                      slides={slides}
                      alignClass="flex flex-col text-left justify-start items-start"
                    />
                  );
                }

                if (typeof val === "object") {
                  const obj = val as Record<string, unknown>;

                  if ("url" in obj && typeof obj.url === "string" && !("text" in obj)) {
                    const src = obj.url.trim();
                    if (!src) return null;
                    return (
                      <div key={key || idx} className="w-full">
                        <img
                          src={src}
                          alt={typeof obj.alt === "string" ? obj.alt : ""}
                          className="w-full h-48 object-cover rounded-lg shadow-xs"
                        />
                      </div>
                    );
                  }

                  if ("text" in obj && typeof obj.text === "string") {
                    const label = obj.text.trim();
                    if (!label) return null;
                    return (
                      <div key={key || idx} className="pt-1 flex">
                        <span className="inline-block py-1.5 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded shadow-xs">
                          {label}
                        </span>
                      </div>
                    );
                  }
                }

                return null;
              })}
            </div>
          );
        }
      }
    } catch {
      // fall through
    }
  }

  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
