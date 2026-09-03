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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StorefrontLivePreview } from "@/components/features/campaigns/StorefrontLivePreview";
import { Code, Eye, FileText, Info, Layers, Sparkles } from "lucide-react";
import type { Template } from "@/types/campaign";

interface TemplatePreviewModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: Template) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "details" | "source">("preview");

  if (!template) return null;

  // Extract double curly brace placeholders (e.g. {{subject}}, {{body}})
  const variables = Array.from(
    new Set(template.content.match(/\{\{([^}]+)\}\}/g) || [])
  ).map((v) => v.replace(/[\{\}]/g, "").trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
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
          <TabsContent value="details" className="flex-1 overflow-y-auto my-3 mt-4 space-y-4 focus:outline-none text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md bg-muted/30 p-md rounded-lg border border-border/50 text-base">
              <div>
                <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Channel Target</span>
                <span className="font-semibold text-foreground">{template.channel} Broadcast</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Content Format</span>
                <span className="font-semibold text-foreground">{template.format || "Structured Markup"}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Created Date</span>
                <span className="font-semibold text-foreground">
                  {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">Version</span>
                <span className="font-semibold text-foreground">v1.0 (Production Canonical)</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary" />
                Recommended Usage Guidelines
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This canonical template is designed for seamless integration with audience segments. It enforces brand guidelines, automated layout scaling, and responsive viewport accessibility across desktop and mobile devices.
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-md space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                Optimization Tips
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Personalize header text using dynamic tags like <code className="bg-muted px-1 py-0.5 rounded font-mono">{"{{contact.first_name}}"}</code>.</li>
                <li>Keep main CTA text under 25 characters for maximum conversion rate.</li>
                <li>Ensure fallback default values are configured for null segment properties.</li>
              </ul>
            </div>
          </TabsContent>

          {/* Tab 3: Source Code & Dynamic Variables */}
          <TabsContent value="source" className="flex-1 overflow-y-auto my-3 mt-4 space-y-4 focus:outline-none text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Detected Template Variables ({variables.length})
                </h4>
              </div>
              {variables.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <Badge key={v} variant="outline" className="font-mono text-xs bg-muted/60 text-foreground border-border px-2 py-1">
                      {"{{" + v + "}}"}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No dynamic variables detected in this template content string.</p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground">Raw Content String</h4>
              <pre className="p-md bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                {template.content}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onUseTemplate(template)} className="shadow-sm">
            Use This Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
