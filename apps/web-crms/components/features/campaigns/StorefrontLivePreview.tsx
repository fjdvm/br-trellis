"use client";

import { useState } from "react";
import { Mail, PanelTop, AppWindow } from "lucide-react";
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

function renderFormattedText(text: string): React.ReactNode {
  if (!text) return text;
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

export function StorefrontLivePreview({
  channel,
  content,
  title,
  showReplay = true,
  liveBadgeText = "LIVE",
  className = "",
  recipientEmail = "customer@example.com",
}: {
  channel: CampaignChannel;
  content: ChannelPreviewContent;
  title?: string;
  showReplay?: boolean;
  liveBadgeText?: string;
  className?: string;
  recipientEmail?: string;
}) {
  const [animKey, setAnimKey] = useState(0);

  return (
    <div className={`space-y-sm ${className}`}>
      {/* Header Info Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
          {title || `Storefront Live Preview (${channel})`}
        </span>
        <div className="flex items-center gap-2">
          {showReplay && (channel === "Popup" || channel === "Banner") && (
            <button
              type="button"
              onClick={() => setAnimKey((k) => k + 1)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded cursor-pointer"
            >
              Replay Pop/Slide
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

      {/* E-Commerce Mock Window Container */}
      <div className="bg-background border border-border rounded-xl shadow-md overflow-hidden min-h-[380px] relative flex flex-col">
        {/* Simulated Browser Bar */}
        <div className="bg-muted px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="bg-background/80 border border-border px-3 py-0.5 rounded text-[11px] font-mono text-muted-foreground max-w-[200px] truncate">
            https://store.example.com
          </div>
          <div className="w-10" />
        </div>

        {/* E-Commerce Storefront Canvas */}
        <div className="relative flex-1 bg-slate-50 dark:bg-slate-950 p-3 overflow-hidden flex flex-col justify-between">
          {/* Simulated E-commerce Header */}
          <div className="w-full bg-background border border-border rounded-md p-2 flex items-center justify-between mb-2 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center font-bold text-[10px] text-primary">
                S
              </div>
              <span className="text-xs font-bold text-foreground">Aura Store</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Shop</span>
              <span>Deals</span>
              <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
                Cart (2)
              </span>
            </div>
          </div>

          {/* Banner Channel Preview inside Storefront Top */}
          {channel === "Banner" && (
            <div
              key={`banner-${animKey}`}
              style={{
                animation: "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
              className="w-full bg-primary text-primary-foreground p-3 px-4 rounded-lg flex items-center justify-between gap-3 shadow-md mb-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {content.imageUrl ? (
                  <img
                    src={content.imageUrl}
                    alt="Banner Thumbnail"
                    className="w-6 h-6 object-cover rounded shrink-0"
                  />
                ) : (
                  <PanelTop className="w-4 h-4 shrink-0" />
                )}
                <div className="text-xs font-medium truncate">
                  {renderFormattedText(
                    content.body ||
                      "Special promotional banner appears live at the top of your store!"
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {content.linkUrl && (
                  <span className="text-[11px] font-bold underline cursor-pointer">Learn More</span>
                )}
                {content.dismissible && (
                  <button
                    type="button"
                    className="text-primary-foreground/80 hover:text-primary-foreground text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Simulated Hero Section & Product Grid */}
          <div className="flex-1 space-y-2 opacity-65 pointer-events-none">
            <div className="w-full h-20 bg-muted/60 rounded-md p-3 flex flex-col justify-center">
              <div className="w-1/2 h-3 bg-muted-foreground/30 rounded mb-1.5" />
              <div className="w-3/4 h-2.5 bg-muted-foreground/20 rounded" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="h-24 bg-card border border-border rounded-md p-2 space-y-1.5">
                <div className="w-full h-12 bg-muted/80 rounded" />
                <div className="w-2/3 h-2 bg-muted-foreground/30 rounded" />
                <div className="w-1/3 h-2 bg-primary/40 rounded" />
              </div>
              <div className="h-24 bg-card border border-border rounded-md p-2 space-y-1.5">
                <div className="w-full h-12 bg-muted/80 rounded" />
                <div className="w-2/3 h-2 bg-muted-foreground/30 rounded" />
                <div className="w-1/3 h-2 bg-primary/40 rounded" />
              </div>
            </div>
          </div>

          {/* Email Channel Preview inside E-commerce Mail window */}
          {channel === "Email" && (
            <div className="absolute inset-2 z-20 bg-background border border-border rounded-lg shadow-xl overflow-hidden text-left flex flex-col">
              <div className="bg-muted px-4 py-2 border-b border-border text-xs text-muted-foreground flex items-center justify-between">
                <span className="font-semibold text-foreground truncate">
                  To: customer@example.com
                </span>
                <span>Inbox Email</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                <div className="border-b border-border/60 pb-2">
                  <span className="text-xs text-muted-foreground block">Subject</span>
                  <h4 className="text-base font-bold text-foreground truncate">
                    {renderFormattedText(content.subject || "Your Subject Line Here...")}
                  </h4>
                </div>
                {content.imageUrl && (
                  <div className="w-full h-28 bg-muted rounded overflow-hidden relative">
                    <img
                      src={content.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {renderFormattedText(
                    content.body ||
                      "Compose your email message body to see the live rendering here..."
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Popup Channel Preview Modal Dialog */}
          {channel === "Popup" && (
            <div
              key={`popup-${animKey}`}
              className="absolute inset-0 z-30 flex items-center justify-center p-3"
            >
              {/* Backdrop Blur Overlay */}
              <div
                style={{ animation: "fadeInBackdrop 0.4s ease-out forwards" }}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs"
              />

              {/* Animated Pop Dialog Box */}
              <div
                style={{
                  animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                }}
                className="relative z-10 w-full bg-card border border-border shadow-2xl rounded-xl p-5 text-center space-y-3"
              >
                {content.imageUrl && (
                  <div className="w-full h-28 bg-muted rounded-lg overflow-hidden relative">
                    <img
                      src={content.imageUrl}
                      alt="Popup Graphic"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h4 className="text-headline-sm font-bold text-foreground tracking-tight">
                  {renderFormattedText(content.heading || "Special Announcement")}
                </h4>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {renderFormattedText(
                    content.body ||
                      "Your engaging modal popup body text will pop up live inside this storefront window!"
                  )}
                </div>
                {(content.ctaText || content.ctaUrl) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-md hover:opacity-90 transition-opacity cursor-pointer"
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

      {/* Embedded Keyframes for Preview Animations */}
      <style jsx global>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.65) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeInBackdrop {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes slideDown {
          0% {
            opacity: 0;
            transform: translateY(-24px);
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
