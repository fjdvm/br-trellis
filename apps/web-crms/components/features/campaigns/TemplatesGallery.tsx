"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  Lock,
  Search,
  PlusCircle,
  GripVertical,
  Type,
  AlignLeft,
  Image,
  MousePointerClick,
  Trash2,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplateCard } from "@/components/features/campaigns/TemplateCard";
import { TemplatePreviewModal } from "@/components/features/campaigns/TemplatePreviewModal";
import { useTemplates } from "@/hooks/useTemplates";
import type { CampaignChannel, Template } from "@/types/campaign";

const CHANNELS: CampaignChannel[] = ["Email", "Banner", "Popup"];

interface TemplateBlock {
  id: string;
  type: "heading" | "text" | "image" | "button";
  content: string;
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export function TemplatesGallery() {
  const router = useSafeRouter();
  const { data: templates, isLoading, error, refetch } = useTemplates();
  const [channel, setChannel] = useState<CampaignChannel>("Email");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("name");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Drag and Drop Builder State
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderName, setBuilderName] = useState("");
  const [builderChannel, setBuilderChannel] = useState<CampaignChannel>("Email");
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: "1", type: "heading", content: "Welcome to Our Special Event" },
    { id: "2", type: "text", content: "Enjoy exclusive rewards and discover new arrivals this season." },
    { id: "3", type: "button", content: "Explore Now" },
  ]);

  function addBlock(type: TemplateBlock["type"]) {
    const newBlock: TemplateBlock = {
      id: String(Date.now()),
      type,
      content:
        type === "heading"
          ? "New Headline"
          : type === "text"
          ? "New paragraph text goes here."
          : type === "image"
          ? ""
          : "Click Here",
    };
    setBlocks((prev) => [...prev, newBlock]);
  }

  function updateBlockContent(id: string, content: string) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

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

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">


      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-lg border-b border-border/60">
        <div className="space-y-xs">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Campaign Templates
          </h1>
          <p className="text-body-md text-muted-foreground">
            Pre-designed layouts and modular frameworks for multichannel broadcasts. Duplicate or preview canonical communication patterns.
          </p>
        </div>
        <Button onClick={() => setShowBuilderModal(true)} className="gap-2 shrink-0">
          <PlusCircle className="w-4 h-4" />
          Template Builder
        </Button>
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

      {/* Preview Dialog */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />

      {/* Drag and Drop Template Builder Modal */}
      {showBuilderModal && (
        <Dialog open={showBuilderModal} onOpenChange={setShowBuilderModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <div>
                <DialogTitle className="text-xl font-bold">Drag & Drop Template Builder</DialogTitle>
                <DialogDescription className="mt-1">
                  Drag blocks from the palette on the left and drop them into the canvas to build your custom template.
                </DialogDescription>
              </div>
              <Badge variant="secondary">{builderChannel}</Badge>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden my-4">
              {/* Palette (Left Column) */}
              <div className="md:col-span-4 bg-muted/40 border border-border rounded-lg p-4 space-y-4 flex flex-col">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Template Settings</Label>
                  <Input
                    placeholder="Template Name..."
                    value={builderName}
                    onChange={(e) => setBuilderName(e.target.value)}
                  />
                  <Select
                    value={builderChannel}
                    onValueChange={(v) => setBuilderChannel(v as CampaignChannel)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Banner">Banner</SelectItem>
                      <SelectItem value="Popup">Popup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex-1">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Draggable Blocks</Label>
                  <div className="space-y-2">
                    {[
                      { type: "heading", label: "Heading Block", icon: Type },
                      { type: "text", label: "Text Paragraph", icon: AlignLeft },
                      { type: "image", label: "Image Placeholder", icon: Image },
                      { type: "button", label: "CTA Button", icon: MousePointerClick },
                    ].map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item.type)}
                        className="p-3 bg-background border border-border rounded-md shadow-xs flex items-center justify-between cursor-grab hover:border-primary transition-colors text-sm font-semibold"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="w-4 h-4 text-primary" />
                          <span>{item.label}</span>
                        </div>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canvas (Right Column) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const type = e.dataTransfer.getData("text/plain");
                  if (type) addBlock(type as TemplateBlock["type"]);
                }}
                className="md:col-span-8 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-border rounded-lg p-6 flex flex-col justify-between overflow-y-auto min-h-[360px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                    <span className="font-mono">https://store.example.com</span>
                    <span>Drop blocks below</span>
                  </div>

                  {blocks.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                      <GripVertical className="w-8 h-8 opacity-40 animate-bounce" />
                      <p>Drag and drop elements here to compose your template content</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {blocks.map((block) => (
                        <div
                          key={block.id}
                          className="relative group bg-card border border-border p-4 rounded-lg shadow-sm space-y-2 text-left"
                        >
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {block.type === "heading" && (
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlockContent(block.id, e.target.value)}
                              className="font-bold text-lg"
                              placeholder="Enter heading..."
                            />
                          )}

                          {block.type === "text" && (
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateBlockContent(block.id, e.target.value)}
                              placeholder="Enter body paragraph text..."
                              className="text-sm"
                            />
                          )}

                          {block.type === "image" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="Image URL..."
                              />
                              {block.content && (
                                <img
                                  src={block.content}
                                  alt="Template Graphic"
                                  className="w-full h-28 object-cover rounded-md bg-muted"
                                />
                              )}
                            </div>
                          )}

                          {block.type === "button" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                placeholder="Button Label..."
                                className="font-semibold"
                              />
                              <Button className="w-full" type="button">
                                {block.content || "Click Me"}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      addBlock("text");
                    }}
                  >
                    + Add Block
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" onClick={() => setShowBuilderModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowBuilderModal(false);
                  refetch();
                }}
                disabled={!builderName.trim() || blocks.length === 0}
              >
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
