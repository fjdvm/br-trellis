"use client";

import { Eye, Edit3, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types/campaign";

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
  onEdit?: (template: Template) => void;
  onDelete?: (template: Template) => void;
}

/** Helper to render HTML, block arrays, or formatted template strings */
function renderFormattedContent(htmlOrText: string, format?: string): React.ReactNode {
  if (!htmlOrText) return null;

  if (format === "Blocks") {
    try {
      const blocks = JSON.parse(htmlOrText);
      if (Array.isArray(blocks)) {
        return (
          <span className="font-sans font-medium text-foreground">
            {blocks.map((b: any) => b.label || b.type).join(" • ")}
          </span>
        );
      }
    } catch (e) {
      // Fall through if parsing fails
    }
  }

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

export function TemplateCard({ template, onPreview, onUse, onEdit, onDelete }: TemplateCardProps) {
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
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-2 relative flex flex-col justify-between overflow-hidden">
          {/* Mini Storefront Header */}
          <div className="w-full bg-background border border-border rounded px-1.5 py-0.5 flex items-center justify-between mb-1 shadow-2xs">
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-primary/20 flex items-center justify-center font-bold text-[8px] text-primary">
                S
              </div>
              <span className="text-[9px] font-bold text-foreground">Aura Store</span>
            </div>
            <span className="text-[8px] text-muted-foreground">Shop · Deals</span>
          </div>

          {template.channel === "Banner" && (
            <div className="w-full bg-primary text-primary-foreground p-1.5 px-2 rounded text-[9.5px] font-medium shadow-xs flex items-center justify-between gap-1 mb-1">
              <span className="truncate">{renderFormattedContent(template.content, template.format)}</span>
              <span className="text-[8.5px] font-bold underline shrink-0">Learn More</span>
            </div>
          )}

          {/* Simulated Skeleton Product Cards */}
          <div className="flex-1 space-y-1 opacity-50 pointer-events-none">
            <div className="w-full h-8 bg-muted/60 rounded p-1">
              <div className="w-1/2 h-1.5 bg-muted-foreground/30 rounded mb-1" />
              <div className="w-3/4 h-1 bg-muted-foreground/20 rounded" />
            </div>
          </div>

          {template.channel === "Email" && (
            <div className="absolute inset-1.5 z-10 bg-background border border-border rounded shadow-md p-2 text-left space-y-1 overflow-hidden">
              <div className="border-b border-border/50 pb-0.5 flex justify-between items-center text-[8px] text-muted-foreground">
                <span className="semibold text-foreground truncate">To: customer@example.com</span>
                <span>Inbox</span>
              </div>
              <div className="text-[10px] font-bold text-foreground truncate">Email Subject</div>
              <div className="text-[9px] text-muted-foreground line-clamp-2 leading-tight">
                {renderFormattedContent(template.content, template.format)}
              </div>
            </div>
          )}

          {template.channel === "Popup" && (
            <div className="absolute inset-0 z-20 bg-black/30 backdrop-blur-xs flex items-center justify-center p-2">
              <div className="bg-card text-card-foreground border border-border p-2 rounded-lg text-center space-y-1 shadow-lg w-full max-w-[180px]">
                <div className="text-[10px] font-bold text-foreground truncate">Special Announcement</div>
                <div className="text-[8.5px] text-muted-foreground line-clamp-2 leading-tight">
                  {renderFormattedContent(template.content, template.format)}
                </div>
                <div className="bg-primary text-primary-foreground text-[8px] font-semibold py-0.5 px-2 rounded mt-0.5">
                  Claim Offer
                </div>
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
        <div className="pt-sm border-t border-border/40 flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPreview(template)}
            className="flex-1 gap-1 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(template)}
              className="gap-1 text-xs px-2"
              title="Edit template"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDelete(template)}
              className="gap-1 text-xs px-2 text-destructive hover:bg-destructive/10"
              title="Delete template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
