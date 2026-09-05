import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  GripVertical,
  Type,
  AlignLeft,
  Image,
  MousePointerClick,
  Images,
  Link as LinkIcon,
} from "lucide-react";
import { type TemplateBlock } from "@/features/campaigns/components/template-builder-components";
import { BlockDeleteDialog } from "@/features/campaigns/components/block-delete-dialog";
import {
  CANVAS_DROPPABLE_ID,
  DragOverlayContent,
  PaletteDraggableItem,
  SortableBlockCard,
  useCanvasDroppable,
  type ActiveDragItem,
} from "@/features/campaigns/components/template-builder-dnd";
import { useRenderedPreviewHtml } from "@/features/campaigns/hooks/use-rendered-preview-html";
import type { BlockType, ChannelConstraints } from "@/features/campaigns/services/template-constraints";

interface EmailBuilderContentProps {
  builderName: string;
  setBuilderName: (v: string) => void;
  builderDescription: string;
  setBuilderDescription: (v: string) => void;
  blocks: TemplateBlock[];
  constraints: ChannelConstraints;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  setBuilderError: (msg: string | null) => void;
}

export function EmailBuilderContent({
  builderName,
  setBuilderName,
  builderDescription,
  setBuilderDescription,
  blocks,
  constraints,
  addBlock,
  updateBlock,
  removeBlock,
  reorderBlocks,
  setBuilderError,
}: EmailBuilderContentProps) {
  const [activeDragItem, setActiveDragItem] = useState<ActiveDragItem | null>(null);
  const [pendingDeleteBlock, setPendingDeleteBlock] = useState<TemplateBlock | null>(null);
  const { setNodeRef: setCanvasNodeRef, isOver: isCanvasOver } = useCanvasDroppable();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const paletteItems = [
    { type: "carousel" as const, label: "Stacked Images", icon: Images, max: constraints.maxCarousel },
    { type: "image" as const, label: "Image Placeholder", icon: Image, max: constraints.maxImages },
    { type: "link" as const, label: "Text Link", icon: LinkIcon, max: constraints.maxLinks },
    { type: "heading" as const, label: "Heading Title", icon: Type, max: constraints.maxHeadings },
    { type: "text" as const, label: "Text Paragraph", icon: AlignLeft, max: constraints.maxTexts },
    { type: "button" as const, label: "CTA Button", icon: MousePointerClick, max: constraints.maxButtons },
  ] as const;

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as ActiveDragItem | undefined;
    if (data) setActiveDragItem(data);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const data = active.data.current as (ActiveDragItem & { blockType?: BlockType }) | undefined;
    setActiveDragItem(null);
    if (!over || !data) return;

    if (data.source === "palette" && data.blockType) {
      addBlock(data.blockType);
      return;
    }

    if (data.source === "block" && over.id !== active.id && over.id !== CANVAS_DROPPABLE_ID) {
      reorderBlocks(String(active.id), String(over.id));
    }
  }

  const isPaletteDragActive = activeDragItem?.source === "palette";

  // Rendered by the real backend renderer (EmailBodyRenderer) so this preview can
  // never silently diverge from what a Campaign referencing this Template would
  // actually send/display.
  const blocksJson = useMemo(
    () =>
      blocks.length === 0
        ? ""
        : JSON.stringify(
            blocks.map((block, index) => ({
              type: block.type,
              label: block.label,
              order: index,
              textAlign: block.textAlign,
              isBold: block.isBold,
              isItalic: block.isItalic,
              content: block.content,
            }))
          ),
    [blocks]
  );
  const { html: blocksHtml } = useRenderedPreviewHtml(blocksJson);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden my-4">
        {/* 1. Palette */}
        <div className="lg:col-span-3 bg-muted/40 border border-border rounded-lg p-4 space-y-4 flex flex-col max-h-[320px] lg:max-h-none lg:min-h-0 overflow-y-auto">
          <div className="space-y-2 shrink-0">
            <Label className="text-xs uppercase font-bold text-muted-foreground">
              Template Settings
            </Label>
            <Input
              placeholder="Template Name..."
              value={builderName}
              onChange={(e) => setBuilderName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)..."
              value={builderDescription}
              onChange={(e) => setBuilderDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            <Label className="text-xs uppercase font-bold text-muted-foreground">
              Draggable Blocks
            </Label>
            <div className="space-y-2">
              {paletteItems
                .filter((item) => item.max > 0)
                .map((item) => {
                  const count = blocks.filter((b) => b.type === item.type).length;
                  const disabled = count >= item.max;
                  return (
                    <PaletteDraggableItem
                      key={item.type}
                      type={item.type}
                      label={item.label}
                      Icon={item.icon}
                      count={count}
                      max={item.max}
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) {
                          addBlock(item.type);
                        } else {
                          setBuilderError(`Email allows max ${item.max} ${item.label}(s).`);
                        }
                      }}
                    />
                  );
                })}
            </div>
          </div>
        </div>

        {/* 2. Drag and Drop Canvas */}
        <div
          ref={setCanvasNodeRef}
          className={`lg:col-span-6 border-2 border-dashed rounded-xl p-4 flex flex-col justify-between overflow-y-auto min-h-[380px] transition-colors ${
            isPaletteDragActive && isCanvasOver
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-border bg-slate-100 dark:bg-slate-950"
          }`}
        >
          <div className="space-y-3">
            <div className="bg-slate-900 text-slate-200 p-2.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="font-mono text-xs text-slate-300 ml-1">
                  mail.store-app.com/builder/canvas
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Block Configurator
              </span>
            </div>

            <div className="bg-background border border-border/80 rounded-xl shadow-md overflow-hidden p-4 w-full text-left space-y-3">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-foreground">
                  Subject:{" "}
                  <span className="font-normal text-muted-foreground">
                    {builderName || "Campaign Announcement"}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  <span className="font-semibold text-foreground">From:</span> Aura Store
                  &lt;newsletter@aurastore.com&gt;
                </div>
              </div>

              <div className="pt-2 border-b border-dashed border-border pb-2">
                <p className="text-[10px] font-mono text-center text-muted-foreground uppercase tracking-wider">
                  — Drag &amp; drop blocks to configure —
                </p>
              </div>

              {blocks.length === 0 ? (
                <div
                  className={`h-40 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2 border border-dashed rounded-lg transition-colors ${
                    isPaletteDragActive && isCanvasOver ? "border-primary/60 bg-primary/5" : "border-border/60"
                  }`}
                >
                  <GripVertical className="w-6 h-6 opacity-40 animate-bounce" />
                  <p>Drag and drop elements here to compose content</p>
                </div>
              ) : (
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {blocks.map((block) => (
                      <SortableBlockCard
                        key={block.id}
                        block={block}
                        onUpdate={(patch) => updateBlock(block.id, patch)}
                        onRemove={() => setPendingDeleteBlock(block)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => addBlock("text")}>
              + Add Block
            </Button>
          </div>
        </div>

        {/* 3. Clean Render Preview */}
        <div className="lg:col-span-3 bg-background border border-border rounded-xl p-4 flex flex-col justify-between overflow-y-auto min-h-[380px] shadow-sm">
          <div className="space-y-3">
            <div className="bg-slate-900 text-slate-200 p-2.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="font-mono text-xs text-slate-300 ml-1">Live Render Preview</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Clean Output
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl shadow-xs p-4 space-y-3 text-left">
              <div className="border-b border-border/60 pb-2 space-y-1">
                <h4 className="font-bold text-sm text-foreground">
                  {builderName || "Campaign Announcement"}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Aura Store Marketing &lt;newsletter@aurastore.com&gt;
                </p>
              </div>

              {blocks.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md p-4 text-center">
                  No components added yet. Add blocks from the palette to see how they render.
                </div>
              ) : (
                <div
                  className="pt-1 text-xs"
                  dangerouslySetInnerHTML={{ __html: blocksHtml }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        <DragOverlayContent item={activeDragItem} />
      </DragOverlay>

      <BlockDeleteDialog
        pendingBlock={pendingDeleteBlock}
        onCancel={() => setPendingDeleteBlock(null)}
        onConfirm={() => {
          if (pendingDeleteBlock) removeBlock(pendingDeleteBlock.id);
          setPendingDeleteBlock(null);
        }}
      />
    </DndContext>
  );
}
