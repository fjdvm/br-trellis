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
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
              <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recipients</span>
                <span className="text-headline-sm font-bold text-foreground mt-1">1 contact</span>
              </div>
              <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dispatched</span>
                <span className="text-headline-sm font-bold text-foreground mt-1">1 sent</span>
              </div>
              <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Open Rate</span>
                <span className="text-headline-sm font-bold text-foreground mt-1">0%</span>
              </div>
              <div className="bg-muted/30 p-md rounded-lg border border-border/50 flex flex-col">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Click Rate</span>
                <span className="text-headline-sm font-bold text-foreground mt-1">0%</span>
              </div>
            </div>

            {/* Hourly Engagement Rate Graph Chart Below Stat Cards */}
            <div className="bg-card border border-border rounded-xl p-md space-y-sm shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Hourly Engagement Rate</h4>
                  <p className="text-xs text-muted-foreground">Aggregate clicks &amp; conversions during launch window</p>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                  +18.4% vs benchmark
                </Badge>
              </div>

              {/* Bar Chart Wireframe */}
              <div className="h-32 w-full flex items-end justify-between gap-sm pt-md pb-xs border-b border-border/50">
                {[
                  { day: "Hour 1", count: 1, height: "100%", bg: "bg-gradient-to-t from-violet-600 to-violet-400 group-hover:from-violet-500 group-hover:to-violet-300" },
                  { day: "Hour 2", count: 0, height: "6px", bg: "bg-gradient-to-t from-purple-500/50 to-purple-400/30" },
                  { day: "Hour 3", count: 0, height: "6px", bg: "bg-gradient-to-t from-indigo-500/50 to-indigo-400/30" },
                  { day: "Hour 4", count: 0, height: "6px", bg: "bg-gradient-to-t from-pink-500/50 to-pink-400/30" },
                  { day: "Hour 5", count: 0, height: "6px", bg: "bg-gradient-to-t from-fuchsia-500/50 to-fuchsia-400/30" },
                  { day: "Hour 6", count: 0, height: "6px", bg: "bg-gradient-to-t from-sky-500/50 to-sky-400/30" },
                  { day: "Hour 7", count: 0, height: "6px", bg: "bg-gradient-to-t from-emerald-500/50 to-emerald-400/30" },
                ].map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-xs text-muted-foreground mb-1 font-semibold">{item.count}</span>
                    <div
                      className={`w-full ${item.bg} rounded-t transition-all shadow-xs`}
                      style={{ height: item.height }}
                    />
                    <span className="text-xs text-muted-foreground mt-1.5">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Grid for Dispatch Result & Engagement Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Dispatch Result Container */}
              <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-sm">
                <h4 className="text-sm font-bold text-foreground">Dispatch Result</h4>
                <div className="flex flex-col space-y-1.5 text-base">
                  <div>
                    <span className="text-muted-foreground">Recipients: </span>
                    <span className="font-semibold text-foreground">1</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sent: </span>
                    <span className="font-semibold text-foreground">1</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed: </span>
                    <span className="font-semibold text-foreground">0</span>
                  </div>
                </div>
              </div>

              {/* Engagement Analytics Container */}
              <div className="bg-card border border-border rounded-xl p-md shadow-xs space-y-sm">
                <h4 className="text-sm font-bold text-foreground">Engagement Analytics</h4>
                <div className="grid grid-cols-2 gap-2 text-base">
                  <div>
                    <span className="text-muted-foreground block text-xs">Open Rate</span>
                    <span className="font-semibold text-foreground text-base">0%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Click Rate</span>
                    <span className="font-semibold text-foreground text-base">0%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Opened</span>
                    <span className="font-semibold text-foreground text-base">0</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Clicked</span>
                    <span className="font-semibold text-foreground text-base">0</span>
                  </div>
                </div>
              </div>
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
              <h4 className="text-sm font-bold text-foreground">
                {template.format === "Blocks" ? "Configured Template Blocks" : "Raw Content String"}
              </h4>
              {template.format === "Blocks" ? (
                <div className="space-y-2">
                  {(() => {
                    try {
                      const blocks = JSON.parse(template.content);
                      if (Array.isArray(blocks)) {
                        return blocks.map((b: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/40 border border-border rounded-md text-xs flex items-center justify-between">
                            <span className="font-semibold text-foreground">{b.label || b.type}</span>
                            <Badge variant="outline" className="uppercase text-[10px]">{b.type}</Badge>
                          </div>
                        ));
                      }
                    } catch (e) {}
                    return (
                      <pre className="p-md bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                        {template.content}
                      </pre>
                    );
                  })()}
                </div>
              ) : (
                <pre className="p-md bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">
                  {template.content}
                </pre>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-border mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
