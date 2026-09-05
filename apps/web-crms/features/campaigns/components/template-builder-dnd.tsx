"use client";

import React from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmailBlockCard, type TemplateBlock } from "@/features/campaigns/components/template-builder-components";
import type { BlockType } from "@/features/campaigns/services/template-constraints";

export const CANVAS_DROPPABLE_ID = "template-builder-canvas";

export interface ActiveDragItem {
  source: "palette" | "block";
  label: string;
  Icon?: React.ComponentType<{ className?: string }>;
}

export function PaletteDraggableItem({
  type,
  label,
  Icon,
  count,
  max,
  disabled,
  onClick,
}: {
  type: BlockType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  count: number;
  max: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: "palette", blockType: type, label, Icon } satisfies ActiveDragItem & { blockType: BlockType },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      onClick={onClick}
      className={`p-2.5 border rounded-md shadow-xs flex items-center justify-between transition-colors text-sm font-semibold ${
        disabled
          ? "bg-muted/40 text-muted-foreground border-border/50 cursor-not-allowed opacity-60"
          : "bg-background border-border cursor-grab active:cursor-grabbing hover:border-primary"
      } ${isDragging ? "opacity-30" : ""}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant={count >= max ? "destructive" : "secondary"} className="px-1.5 py-0">
          {count}/{max}
        </Badge>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}

export function SortableBlockCard({
  block,
  onUpdate,
  onRemove,
}: {
  block: TemplateBlock;
  onUpdate: (patch: Partial<TemplateBlock>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: "block", label: block.label || block.type } satisfies ActiveDragItem,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dragHandle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      title="Drag to reorder"
      className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-0.5 -ml-1 touch-none"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <EmailBlockCard block={block} onUpdate={onUpdate} onRemove={onRemove} dragHandle={dragHandle} isDragging={isDragging} />
    </div>
  );
}

export function useCanvasDroppable() {
  return useDroppable({ id: CANVAS_DROPPABLE_ID });
}

export function DragOverlayContent({ item }: { item: ActiveDragItem | null }) {
  if (!item) return null;

  if (item.source === "palette") {
    const Icon = item.Icon;
    return (
      <div className="p-2.5 border-2 border-primary rounded-md shadow-lg bg-background flex items-center gap-2 text-sm font-semibold cursor-grabbing">
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <span>{item.label}</span>
      </div>
    );
  }

  return (
    <div className="p-3 border-2 border-primary rounded-lg shadow-lg bg-card text-sm font-medium cursor-grabbing flex items-center gap-2">
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <span>{item.label}</span>
    </div>
  );
}
