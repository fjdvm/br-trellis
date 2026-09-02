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

export function TemplateCard({ template, onPreview, onUse }: TemplateCardProps) {
  return (
    <div className="flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Wireframe Skeleton Preview */}
      <div
        data-testid={`template-preview-${template.id}`}
        className="h-44 bg-muted/40 p-md flex flex-col justify-between relative overflow-hidden border-b border-border/50 select-none cursor-pointer"
        onClick={() => onPreview(template)}
      >
        <div className="w-full h-full overflow-hidden text-xs text-muted-foreground opacity-75 pointer-events-none">
          <div
            className="transform scale-90 origin-top-left"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
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
        <div className="grid grid-cols-2 gap-xs pt-sm border-t border-border/40">
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
          <Button
            type="button"
            size="sm"
            onClick={() => onUse(template)}
            className="w-full gap-1 text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Use
          </Button>
        </div>
      </div>
    </div>
  );
}
