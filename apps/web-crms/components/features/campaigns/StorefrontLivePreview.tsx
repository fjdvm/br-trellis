"use client";

import { useState } from "react";
import { Mail, PanelTop, AppWindow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CampaignChannel } from "@/types/campaign";

export type ChannelPreviewContent = {
  subject?: string;
  heading?: string;
  body?: string;
  imageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  dismissible?: boolean;
};

// ---------------------------------------------------------------------------
// Block types that can appear in a preview body JSON array
// ---------------------------------------------------------------------------
type PreviewBlock = {
  type: string;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  // filled-in value from user input:
  content?:
    | string
    | { text?: string; url?: string }
    | { url?: string; alt?: string }
    | Array<{ imageUrl?: string; caption?: string; linkUrl?: string }>;
};

// ---------------------------------------------------------------------------
// renderFormattedText
// Handles:
//  • Plain text (with **bold** / *italic* markdown)
//  • HTML strings
//  • JSON arrays of PreviewBlocks (with or without .content)
// ---------------------------------------------------------------------------
function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;

  // ── JSON block array ──────────────────────────────────────────────────────
  if (text.trim().startsWith("[") && text.trim().endsWith("]")) {
    try {
      const parsed: PreviewBlock[] = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
        return (
          <div className="space-y-2">
            {parsed.map((block, idx) => {
              const alignClass =
                block.textAlign === "center"
                  ? "text-center justify-center items-center"
                  : block.textAlign === "right"
                  ? "text-right justify-end items-end"
                  : "text-left justify-start items-start";

              const textStyle = `${block.isBold ? "font-bold" : ""} ${block.isItalic ? "italic" : ""}`.trim();

              // ── heading ────────────────────────────────────────────────────
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

              // ── text paragraph ─────────────────────────────────────────────
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

              // ── button ─────────────────────────────────────────────────────
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

              // ── image ──────────────────────────────────────────────────────
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
                        className="w-full h-20 object-cover rounded border border-border"
                      />
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className={`w-full h-14 bg-muted/60 rounded flex items-center justify-center text-xs text-muted-foreground font-semibold border border-dashed border-border ${alignClass}`}
                  >
                    📷 {block.label}
                  </div>
                );
              }

              // ── carousel ───────────────────────────────────────────────────
              if (block.type === "carousel") {
                const slides = Array.isArray(block.content) ? block.content : [];
                const filledSlides = slides.filter((s) => s.imageUrl?.trim());
                if (filledSlides.length > 0) {
                  return (
                    <div key={idx} className="flex gap-1.5 overflow-hidden">
                      {filledSlides.map((slide, si) => (
                        <div key={si} className="flex-1 min-w-0">
                          <img
                            src={slide.imageUrl}
                            alt={slide.caption || `Slide ${si + 1}`}
                            className="w-full h-14 object-cover rounded border border-border"
                          />
                          {slide.caption && (
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5 text-center">
                              {slide.caption}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className={`w-full h-14 bg-muted/60 rounded flex items-center justify-center text-xs text-muted-foreground font-semibold border border-dashed border-border ${alignClass}`}
                  >
                    🎠 {block.label}
                  </div>
                );
              }

              // ── link ───────────────────────────────────────────────────────
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

              // ── fallback ───────────────────────────────────────────────────
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

  // ── HTML ──────────────────────────────────────────────────────────────────
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  // ── Markdown bold/italic ──────────────────────────────────────────────────
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

// ---------------------------------------------------------------------------
// StorefrontLivePreview
// ---------------------------------------------------------------------------
export function StorefrontLivePreview({
  channel,
  content,
  title,
  showReplay = true,
  liveBadgeText = "LIVE",
  className = "",
}: {
  channel: CampaignChannel;
  content: ChannelPreviewContent;
  title?: string;
  showReplay?: boolean;
  liveBadgeText?: string;
  className?: string;
}) {
  const [animKey, setAnimKey] = useState(0);

  return (
    <div className={`space-y-sm ${className}`}>
      {/* Header Info Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {title || `Live Preview · ${channel}`}
        </span>
        <div className="flex items-center gap-2">
          {showReplay && (channel === "Popup" || channel === "Banner") && (
            <button
              type="button"
              onClick={() => setAnimKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded cursor-pointer"
            >
              Replay
            </button>
          )}
          {liveBadgeText && (
            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {liveBadgeText}
            </span>
          )}
        </div>
      </div>

      {/* Mock browser window */}
      <div className="bg-background border border-border rounded-xl shadow-md overflow-hidden min-h-[380px] relative flex flex-col">
        {/* Chrome bar */}
        <div className="bg-slate-900 text-slate-200 px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="bg-slate-800 border border-slate-700 px-3 py-0.5 rounded text-[11px] font-mono text-slate-300 max-w-[240px] truncate">
            {channel === "Email" ? "mail.store-app.com/inbox" : "https://store.example.com"}
          </div>
          <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700 uppercase font-mono">
            {channel}
          </Badge>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 p-3 overflow-hidden flex flex-col justify-between">

          {/* ── Storefront / Email top nav ─────────────────────────── */}
          {channel === "Email" ? (
            <div className="w-full bg-background border border-border rounded-lg shadow-xs p-3 space-y-2 mb-2 text-left">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    M
                  </div>
                  <div>
                    <span className="text-xs font-bold text-foreground block">Aura Store Marketing</span>
                    <span className="text-[10px] text-muted-foreground">noreply@aurastore.com</span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Today, 10:42 AM</span>
              </div>
              <div className="text-sm font-bold text-foreground">
                {renderFormattedText(content.subject || "Subject: Exclusive Seasonal Update")}
              </div>
            </div>
          ) : (
            <div className="w-full bg-background border border-border rounded-md p-2 flex items-center justify-between mb-2 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary">
                  S
                </div>
                <span className="text-xs font-bold text-foreground">Aura Storefront</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Shop</span>
                <span>Deals</span>
                <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">Cart (2)</span>
              </div>
            </div>
          )}

          {/* ── Banner strip ─────────────────────────────────────────── */}
          {channel === "Banner" && (
            <div
              key={`banner-${animKey}`}
              style={{ animation: "slideDown 0.6s cubic-bezier(0.16,1,0.3,1) forwards" }}
              className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-3 px-4 rounded-lg flex items-center justify-between gap-3 shadow-md mb-2"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {content.imageUrl ? (
                  <img
                    src={content.imageUrl}
                    alt="Banner Thumbnail"
                    className="w-8 h-8 object-cover rounded shrink-0 border border-primary-foreground/20"
                  />
                ) : (
                  <PanelTop className="w-4 h-4 shrink-0" />
                )}
                <div className="text-xs font-medium truncate">
                  {renderFormattedText(
                    content.body || "Your promotional banner message will appear here."
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {content.linkUrl && (
                  <span className="text-[11px] font-bold underline bg-primary-foreground/10 px-2 py-1 rounded cursor-pointer hover:bg-primary-foreground/20">
                    Learn More
                  </span>
                )}
                {content.dismissible && (
                  <button type="button" className="text-primary-foreground/80 text-xs p-1">
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Storefront skeleton (background filler) ───────────── */}
          <div className="flex-1 space-y-2 opacity-50 pointer-events-none">
            <div className="w-full h-16 bg-muted/60 rounded-md p-3 flex flex-col justify-center">
              <div className="w-1/2 h-2.5 bg-muted-foreground/30 rounded mb-1.5" />
              <div className="w-3/4 h-2 bg-muted-foreground/20 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-20 bg-card border border-border rounded-md p-2 space-y-1.5">
                <div className="w-full h-10 bg-muted/80 rounded" />
                <div className="w-2/3 h-2 bg-muted-foreground/30 rounded" />
              </div>
              <div className="h-20 bg-card border border-border rounded-md p-2 space-y-1.5">
                <div className="w-full h-10 bg-muted/80 rounded" />
                <div className="w-2/3 h-2 bg-muted-foreground/30 rounded" />
              </div>
            </div>
          </div>

          {/* ── Email body panel ─────────────────────────────────────── */}
          {channel === "Email" && (
            <div className="absolute inset-x-3 bottom-3 top-20 z-20 bg-background border border-border rounded-lg shadow-xl overflow-hidden text-left flex flex-col">
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {content.imageUrl && (
                  <div className="w-full h-32 bg-muted rounded-lg overflow-hidden border border-border">
                    <img
                      src={content.imageUrl}
                      alt="Email hero"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                  {renderFormattedText(
                    content.body ||
                      "Compose your email message body to see it rendered here in real time…"
                  )}
                </div>
                {(content.ctaText || content.ctaUrl) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      className="py-2 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-md shadow hover:opacity-90 transition-opacity"
                    >
                      {content.ctaText || "Click Here"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Popup overlay ────────────────────────────────────────── */}
          {channel === "Popup" && (
            <div
              key={`popup-${animKey}`}
              className="absolute inset-0 z-30 flex items-center justify-center p-3"
            >
              <div
                style={{ animation: "fadeInBackdrop 0.4s ease-out forwards" }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />
              <div
                style={{ animation: "popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}
                className="relative z-10 w-full bg-card border border-border shadow-2xl rounded-xl p-4 text-center space-y-3"
              >
                {content.imageUrl && (
                  <div className="w-full h-24 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={content.imageUrl}
                      alt="Popup graphic"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h4 className="text-base font-bold text-foreground tracking-tight">
                  {renderFormattedText(content.heading || "Special Announcement")}
                </h4>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {renderFormattedText(
                    content.body || "Your popup body text will appear here as you type…"
                  )}
                </div>
                {(content.ctaText || content.ctaUrl) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      className="w-full py-2 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      {content.ctaText || "Learn More"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Keyframes */}
      <style jsx global>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.65) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeInBackdrop {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-24px); }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
