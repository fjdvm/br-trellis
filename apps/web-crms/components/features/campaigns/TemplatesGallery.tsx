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
  SlidersHorizontal,
  Link as LinkIcon,
  Bold,
  Italic,
  AlignCenter,
  AlignRight,
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
import {
  getChannelConstraints,
  validateBlockCount,
  type BlockType,
} from "@/lib/template-constraints";
import type { CampaignChannel, Template } from "@/types/campaign";

const CHANNELS: CampaignChannel[] = ["Email", "Banner", "Popup"];

export interface TemplateBlock {
  id: string;
  type: BlockType;
  content: string;
  url?: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
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
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: "1", type: "heading", content: "Welcome to Our Special Event", textAlign: "left" },
    { id: "2", type: "text", content: "Enjoy exclusive rewards and discover new arrivals this season.", textAlign: "left" },
    { id: "3", type: "button", content: "Explore Now", url: "#" },
  ]);

  const constraints = useMemo(() => getChannelConstraints(builderChannel), [builderChannel]);

  function handleChannelChange(newChannel: CampaignChannel) {
    setBuilderChannel(newChannel);
    setBuilderError(null);

    // Auto-prune/enforce blocks according to new channel limits
    const newConstraints = getChannelConstraints(newChannel);
    let carouselCount = 0;
    let imageCount = 0;
    let linkCount = 0;
    let headingCount = 0;
    let textCount = 0;
    let buttonCount = 0;

    const pruned = blocks.filter((b) => {
      if (b.type === "carousel") {
        if (carouselCount < newConstraints.maxCarousel) {
          carouselCount++;
          return true;
        }
        return false;
      }
      if (b.type === "image") {
        if (imageCount < newConstraints.maxImages) {
          imageCount++;
          return true;
        }
        return false;
      }
      if (b.type === "link") {
        if (linkCount < newConstraints.maxLinks) {
          linkCount++;
          return true;
        }
        return false;
      }
      if (b.type === "heading") {
        if (headingCount < newConstraints.maxHeadings) {
          headingCount++;
          return true;
        }
        return false;
      }
      if (b.type === "text") {
        if (textCount < newConstraints.maxTexts) {
          textCount++;
          return true;
        }
        return false;
      }
      if (b.type === "button") {
        if (buttonCount < newConstraints.maxButtons) {
          buttonCount++;
          return true;
        }
        return false;
      }
      return true;
    });

    setBlocks(pruned);
  }

  function addBlock(type: BlockType) {
    const currentCount = blocks.filter((b) => b.type === type).length;
    const check = validateBlockCount(builderChannel, type, currentCount);

    if (!check.allowed) {
      setBuilderError(check.reason ?? "Component limit exceeded for channel.");
      return;
    }

    setBuilderError(null);
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
          : type === "carousel"
          ? "Featured Banner 1, Featured Banner 2"
          : type === "link"
          ? "Click here to view details"
          : "Click Here",
      url: type === "link" || type === "button" ? "#" : undefined,
      textAlign: "left",
    };
    setBlocks((prev) => [...prev, newBlock]);
  }

  function updateBlock(id: string, patch: Partial<TemplateBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setBuilderError(null);
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
                    onValueChange={(v) => handleChannelChange(v as CampaignChannel)}
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

                {/* Channel Constraints & Rules Section */}
                <div className="bg-muted/70 border border-border/80 rounded-md p-3 space-y-2 text-xs">
                  <div className="font-bold text-foreground flex items-center justify-between">
                    <span>{builderChannel} Constraints & Rules</span>
                    <Badge variant="outline" className="text-[10px]">
                      Max Limits
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-muted-foreground">
                    <div>Carousel: <span className="font-semibold text-foreground">{constraints.maxCarousel} max</span></div>
                    <div>Images: <span className="font-semibold text-foreground">{constraints.maxImages} max</span></div>
                    <div>Links: <span className="font-semibold text-foreground">{constraints.maxLinks} max</span></div>
                    <div>Headings: <span className="font-semibold text-foreground">{constraints.maxHeadings} max</span></div>
                    <div>Paragraphs: <span className="font-semibold text-foreground">{constraints.maxTexts} max</span></div>
                    <div>Buttons: <span className="font-semibold text-foreground">{constraints.maxButtons} max</span></div>
                  </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">Draggable Blocks</Label>
                  <div className="space-y-2">
                    {[
                      { type: "carousel" as const, label: "Carousel", icon: SlidersHorizontal, max: constraints.maxCarousel },
                      { type: "image" as const, label: "Image Placeholder", icon: Image, max: constraints.maxImages },
                      { type: "link" as const, label: "Text Link", icon: LinkIcon, max: constraints.maxLinks },
                      { type: "heading" as const, label: "Heading Title", icon: Type, max: constraints.maxHeadings },
                      { type: "text" as const, label: "Text Paragraph", icon: AlignLeft, max: constraints.maxTexts },
                      { type: "button" as const, label: "CTA Button", icon: MousePointerClick, max: constraints.maxButtons },
                    ].map((item) => {
                      const count = blocks.filter((b) => b.type === item.type).length;
                      const disabled = count >= item.max;
                      return (
                        <div
                          key={item.type}
                          draggable={!disabled}
                          onDragStart={(e) => {
                            if (!disabled) {
                              e.dataTransfer.setData("text/plain", item.type);
                            }
                          }}
                          onClick={() => {
                            if (!disabled) {
                              addBlock(item.type);
                            } else {
                              setBuilderError(`${builderChannel} allows max ${item.max} ${item.label}(s).`);
                            }
                          }}
                          className={`p-2.5 border rounded-md shadow-xs flex items-center justify-between transition-colors text-xs font-semibold ${
                            disabled
                              ? "bg-muted/40 text-muted-foreground border-border/50 cursor-not-allowed opacity-60"
                              : "bg-background border-border cursor-grab hover:border-primary"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-primary shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={count >= item.max ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0">
                              {count}/{item.max}
                            </Badge>
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Canvas (Right Column) */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const type = e.dataTransfer.getData("text/plain");
                  if (type) addBlock(type as BlockType);
                }}
                className="md:col-span-8 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-border rounded-lg p-5 flex flex-col justify-between overflow-y-auto min-h-[380px]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                    <span className="font-mono">https://store.example.com</span>
                    <span>Drop elements or click palette blocks to add</span>
                  </div>

                  {builderError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/40 text-destructive text-xs font-medium rounded-md flex items-center justify-between">
                      <span>{builderError}</span>
                      <button
                        type="button"
                        onClick={() => setBuilderError(null)}
                        className="text-xs hover:underline ml-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

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
                          className="relative group bg-card border border-border p-4 rounded-lg shadow-sm space-y-3 text-left"
                        >
                          <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <Badge variant="outline" className="uppercase text-[10px] font-semibold tracking-wider">
                              {block.type}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Block Rich Formatting Controls for Text/Heading */}
                          {(block.type === "heading" || block.type === "text") && (
                            <div className="flex items-center justify-between bg-muted/50 border border-border p-1 rounded-md mb-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Bold"
                                  onClick={() => updateBlock(block.id, { isBold: !block.isBold })}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    block.isBold ? "bg-background text-primary shadow-xs font-bold" : "hover:bg-background text-foreground"
                                  }`}
                                >
                                  <Bold className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Italic"
                                  onClick={() => updateBlock(block.id, { isItalic: !block.isItalic })}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    block.isItalic ? "bg-background text-primary shadow-xs italic" : "hover:bg-background text-foreground"
                                  }`}
                                >
                                  <Italic className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Align Left"
                                  onClick={() => updateBlock(block.id, { textAlign: "left" })}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    block.textAlign === "left" ? "bg-background text-primary shadow-xs" : "text-muted-foreground hover:bg-background"
                                  }`}
                                >
                                  <AlignLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Align Center"
                                  onClick={() => updateBlock(block.id, { textAlign: "center" })}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    block.textAlign === "center" ? "bg-background text-primary shadow-xs" : "text-muted-foreground hover:bg-background"
                                  }`}
                                >
                                  <AlignCenter className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Align Right"
                                  onClick={() => updateBlock(block.id, { textAlign: "right" })}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    block.textAlign === "right" ? "bg-background text-primary shadow-xs" : "text-muted-foreground hover:bg-background"
                                  }`}
                                >
                                  <AlignRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                          {block.type === "heading" && (
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              style={{
                                textAlign: block.textAlign || "left",
                                fontWeight: block.isBold ? "bold" : "normal",
                                fontStyle: block.isItalic ? "italic" : "normal",
                              }}
                              className="font-bold text-lg"
                              placeholder="Enter heading..."
                            />
                          )}

                          {block.type === "text" && (
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              style={{
                                textAlign: block.textAlign || "left",
                                fontWeight: block.isBold ? "bold" : "normal",
                                fontStyle: block.isItalic ? "italic" : "normal",
                              }}
                              placeholder="Enter body paragraph text..."
                              className="text-base min-h-[80px]"
                            />
                          )}

                          {block.type === "carousel" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                placeholder="Carousel slides comma separated..."
                              />
                              <div className="p-3 bg-muted/40 border border-border rounded-md text-xs text-muted-foreground flex items-center justify-between">
                                <SlidersHorizontal className="w-4 h-4 text-primary" />
                                <span>Interactive Banner Carousel (1 max for Email)</span>
                              </div>
                            </div>
                          )}

                          {block.type === "image" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
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

                          {block.type === "link" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                placeholder="Link Label text..."
                              />
                              <Input
                                value={block.url || ""}
                                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                placeholder="Target URL (e.g. https://...)"
                              />
                            </div>
                          )}

                          {block.type === "button" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                placeholder="Button Label..."
                                className="font-semibold"
                              />
                              <Input
                                value={block.url || ""}
                                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                placeholder="Button Link URL..."
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
              </div>
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
