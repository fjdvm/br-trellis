"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateCard } from "@/features/campaigns/components/template-card";
import { TemplatePreviewModal } from "@/features/campaigns/components/template-preview-modal";
import { useTemplates } from "@/features/campaigns/hooks/useTemplates";
import type { CampaignChannel, Template } from "@/features/campaigns/types";

const CHANNELS: CampaignChannel[] = ["Email", "Banner", "Popup"];

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

// Main TemplatesGallery
export function TemplatesGallery() {
  const router = useSafeRouter();
  const { data: templates, isLoading, error } = useTemplates();
  const [channel, setChannel] = useState<CampaignChannel>("Email");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("name");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = useMemo(() => {
    let list = templates.filter((t) => {
      if (channel && t.channel !== channel) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      }
      return true;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [templates, channel, search, sortBy]);

  const handleUseTemplate = (template: Template) => {
    if (router) {
      router.push(`/campaigns/new?templateId=${template.id}&channel=${template.channel}`);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-lg border-b border-border/60">
        <div className="space-y-xs">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Campaign Templates
          </h1>
          <p className="text-body-md text-muted-foreground">
            Pre-designed layouts and modular frameworks for multichannel broadcasts. Duplicate or
            preview canonical communication patterns.
          </p>
        </div>
      </div>

      {error && <div className="p-md text-destructive text-base">{error.message}</div>}

      {isLoading ? (
        <div
          data-testid="templates-gallery-loading"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Tabs value={channel} onValueChange={(v) => setChannel(v as CampaignChannel)}>
          {/* Controls Deck */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-md mb-xl">
            <TabsList className="w-full md:w-auto overflow-x-auto justify-start">
              {CHANNELS.map((c) => {
                const count = templates.filter((t) => t.channel === c).length;
                return (
                  <TabsTrigger key={c} value={c}>
                    {c} ({count})
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex items-center gap-sm flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "updated")}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by: Name</SelectItem>
                  <SelectItem value="updated">Sort by: Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {CHANNELS.map((c) => (
            <TabsContent key={c} value={c} className="mt-0">
              {filteredTemplates.length === 0 ? (
                <div className="p-xl text-muted-foreground text-base text-center border border-dashed rounded-lg">
                  No templates available for this selection.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
                  {filteredTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onPreview={(tpl) => setPreviewTemplate(tpl)}
                      onUse={handleUseTemplate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* ── Preview Dialog ── */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
