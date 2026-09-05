"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StorefrontLivePreview } from "@/features/campaigns/components/storefront-live-preview";
import { TemplateDetailsTab } from "@/features/campaigns/components/template-details-tab";
import { TemplateSourceTab } from "@/features/campaigns/components/template-source-tab";
import { Code, Eye, FileText, Info, Layers, Sparkles, MoreVertical, Edit3, Trash2 } from "lucide-react";

import type { Template } from "@/features/campaigns/types";

interface TemplatePreviewModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: Template) => void;
  onEditTemplate?: (template: Template) => void;
  onDeleteTemplate?: (template: Template) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "details" | "source">("preview");

  if (!template) return null;

  const isBlockTemplate = template.format === "Blocks";

  // Extract double curly brace placeholders (e.g. {{subject}}, {{body}})
  const variables = Array.from(
    new Set(template.content.match(/\{\{([^}]+)\}\}/g) || [])
  ).map((v) => v.replace(/[\{\}]/g, "").trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl h-[90vh] max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6 border-b border-border pb-3">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              {template.name}
              <Badge variant="secondary" className="uppercase text-xs font-semibold">
                {template.channel}
              </Badge>
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {template.description || "System preset communication framework."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tab Navigation in Template Details */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "preview" | "details" | "source")}
          className="w-full flex-1 flex flex-col overflow-hidden mt-3"
        >
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto gap-6 shrink-0">
            <TabsTrigger
              value="preview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-sm font-semibold px-1 pb-2 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Live Preview
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-sm font-semibold px-1 pb-2 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Template Specs & Details
            </TabsTrigger>
            <TabsTrigger
              value="source"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none text-sm font-semibold px-1 pb-2 flex items-center gap-1.5 cursor-pointer"
            >
              <Code className="w-4 h-4" />
              Source Content & Variables
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Live Storefront Presentation Frame */}
          <TabsContent value="preview" className="flex-1 overflow-y-auto my-3 mt-4 focus:outline-none">
            <StorefrontLivePreview
              channel={template.channel}
              content={{
                subject: template.channel === "Email" ? template.name : undefined,
                heading: template.channel === "Popup" ? template.name : undefined,
                body: template.content,
                linkUrl: template.channel === "Banner" ? "#" : undefined,
                ctaText: template.channel === "Popup" ? "Claim Special Offer" : undefined,
              }}
              liveBadgeText="TEMPLATE PREVIEW"
            />
          </TabsContent>

          {/* Tab 2: Template Specifications & Details */}
          <TabsContent value="details" className="flex-1 overflow-y-auto my-3 mt-4 focus:outline-none">
            <TemplateDetailsTab />
          </TabsContent>

          {/* Tab 3: Source Code & Dynamic Variables */}
          <TabsContent value="source" className="flex-1 overflow-y-auto my-3 mt-4 focus:outline-none">
            <TemplateSourceTab template={template} variables={variables} />
          </TabsContent>
        </Tabs>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
          {isBlockTemplate && (onEditTemplate || onDeleteTemplate) ? (
            <div className="flex items-center gap-2">
              {onEditTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onEditTemplate(template);
                  }}
                  className="text-base font-medium px-4 py-2"
                >
                  Edit
                </Button>
              )}
              {onDeleteTemplate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onDeleteTemplate(template);
                  }}
                  className="text-base font-medium px-4 py-2 text-destructive hover:bg-destructive/10 border-border/60"
                >
                  Delete
                </Button>
              )}
            </div>
          ) : (
            <div />
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-base font-medium px-4 py-2">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
