"use client";

import { Eye, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types/campaign";

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
}

/** Helper to render HTML or formatted template strings */
function renderFormattedContent(htmlOrText: string): React.ReactNode {
  if (!htmlOrText) return null;
  if (/<[a-z][\s\S]*>/i.test(htmlOrText)) {
    return <span dangerouslySetInnerHTML={{ __html: htmlOrText }} />;
  }
  const parts = htmlOrText.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  return (
    <div className="flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Live Storefront Preview Frame */}
      <div
        data-testid={`template-preview-${template.id}`}
        className="h-44 bg-muted/30 p-2 flex flex-col justify-between relative overflow-hidden border-b border-border select-none cursor-pointer"
        onClick={() => onPreview(template)}
      >
        {/* Browser Header Bar */}
        <div className="bg-muted px-2 py-1 rounded-t flex items-center justify-between text-[10px] text-muted-foreground border-b border-border">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono truncate">store.example.com</span>
        </div>

        {/* Live Channel Presentation Mockup */}
        <div className="flex-1 bg-background p-2 relative flex flex-col justify-center overflow-hidden">
          {template.channel === "Email" && (
            <div className="bg-card text-foreground rounded p-2 text-left space-y-1 shadow-sm border border-border w-full">
              <span className="text-[9px] font-bold text-muted-foreground block border-b border-border/50 pb-0.5">
                Inbox Email Preview
              </span>
              <div className="text-[11px] font-bold text-primary truncate">Email Subject</div>
              <div className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                {renderFormattedContent(template.content)}
              </div>
            </div>
          )}

          {template.channel === "Banner" && (
            <div className="w-full bg-primary text-primary-foreground p-2 rounded text-center text-[10px] font-semibold shadow-sm flex items-center justify-between gap-1">
              <span className="truncate">{renderFormattedContent(template.content)}</span>
              <span className="text-[9px] underline shrink-0">Learn More</span>
            </div>
          )}

          {template.channel === "Popup" && (
            <div className="bg-card text-card-foreground border border-border p-2.5 rounded-lg text-center space-y-1 shadow-md w-full mx-auto">
              <div className="text-[11px] font-bold text-foreground">Special Announcement</div>
              <div className="text-[9.5px] text-muted-foreground line-clamp-2 leading-tight">
                {renderFormattedContent(template.content)}
              </div>
              <div className="bg-primary text-primary-foreground text-[9px] font-semibold py-0.5 px-2 rounded">
                Claim Offer
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-md flex flex-col flex-1 justify-between gap-md">
        <div className="space-y-xs">
          <div className="flex items-center justify-between gap-xs">
            <Badge variant="secondary" className="uppercase text-[10px] font-semibold tracking-wider">
              {template.channel}
            </Badge>
            <span className="text-xs text-muted-foreground">v1.0</span>
          </div>
          <h2 className="text-title-lg font-bold text-foreground truncate mt-xs">
            {template.name}
          </h2>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description || "Pre-configured communication framework."}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-sm border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            className="w-full gap-1 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
