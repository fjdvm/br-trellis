import { useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { blockTemplatesApi } from "@/features/campaigns/services/campaigns-api";
import { validateBlockCount, getChannelConstraints, type BlockType, type ChannelConstraints } from "@/features/campaigns/services/template-constraints";
import type { CampaignChannel, Template } from "@/features/campaigns/types";
import type { EmailTheme } from "@/features/campaigns/types/block-template";
import type { TemplateBlock } from "@/features/campaigns/components/template-builder-components";

export interface UseTemplateBuilderParams {
  channel: CampaignChannel;
  refetch: () => void;
}

export function useTemplateBuilder({ channel, refetch }: UseTemplateBuilderParams) {
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [builderChannel, setBuilderChannel] = useState<CampaignChannel>("Email");
  const [builderName, setBuilderName] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderTheme, setBuilderTheme] = useState<EmailTheme>("VioletToLight");
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: "1", type: "heading", label: "Hero Title", textAlign: "left" },
    { id: "2", type: "text", label: "Main Body Text", textAlign: "left" },
    { id: "3", type: "button", label: "Primary Action Button" },
  ]);

  const [deleteTemplateItem, setDeleteTemplateItem] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const constraints = useMemo(() => getChannelConstraints(builderChannel), [builderChannel]);

  function handleOpenCreateModal() {
    setEditingTemplateId(null);
    setBuilderName("");
    setBuilderDescription("");
    setBuilderTheme("VioletToLight");
    setBuilderChannel(channel);
    setBuilderError(null);
    setBlocks([
      { id: "1", type: "heading", label: "Hero Title", textAlign: "left" },
      { id: "2", type: "text", label: "Main Body Text", textAlign: "left" },
      { id: "3", type: "button", label: "Primary Action Button" },
    ]);
    setShowBuilderModal(true);
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplateId(template.id);
    setBuilderName(template.name);
    setBuilderDescription(template.description || "");
    setBuilderChannel(template.channel);
    setBuilderTheme(template.theme ?? "VioletToLight");
    setBuilderError(null);

    let parsedBlocks: TemplateBlock[] = [];
    if (template.format === "Blocks" && template.content) {
      try {
        const raw = JSON.parse(template.content);
        if (Array.isArray(raw)) {
          parsedBlocks = raw.map((b: Record<string, unknown>, idx: number) => ({
            id: (b.id as string) || String(idx + 1),
            type: b.type as BlockType,
            label: (b.label as string) || (b.type as string),
            textAlign: (b.textAlign as "left" | "center" | "right") || "left",
            isBold: (b.isBold as boolean) ?? false,
            isItalic: (b.isItalic as boolean) ?? false,
            content: (b.content as TemplateBlock["content"]) ?? null,
          }));
        }
      } catch (e) {}
    }
    setBlocks(
      parsedBlocks.length > 0
        ? parsedBlocks
        : [
            { id: "1", type: "heading", label: "Hero Title", textAlign: "left" },
            { id: "2", type: "text", label: "Main Body Text", textAlign: "left" },
          ]
    );

    setShowBuilderModal(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTemplateItem) return;
    setIsDeleting(true);
    try {
      await blockTemplatesApi.delete(deleteTemplateItem.id);
    } catch (err) {
      console.warn("Could not delete from backend API (may be a static template):", err);
    } finally {
      setDeleteTemplateItem(null);
      setIsDeleting(false);
      refetch();
    }
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
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Block`,
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

  function reorderBlocks(activeId: string, overId: string) {
    if (activeId === overId) return;
    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId);
      const newIndex = prev.findIndex((b) => b.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function isSaveDisabled() {
    if (isSaving) return true;
    if (!builderName.trim()) return true;
    return blocks.length === 0;
  }

  async function handleSaveTemplate() {
    if (!builderName.trim()) {
      setBuilderError("Template name is required.");
      return;
    }

    if (blocks.length === 0) {
      setBuilderError("Template must contain at least one block.");
      return;
    }

    setIsSaving(true);
    setBuilderError(null);

    try {
      const payload = {
        name: builderName.trim(),
        description: builderDescription.trim() || undefined,
        channel: builderChannel,
        theme: builderTheme,
        blocks: blocks.map((b, index) => ({
          type: b.type,
          label: b.label || `${b.type} block`,
          order: index,
          textAlign: b.textAlign || "left",
          isBold: b.isBold ?? false,
          isItalic: b.isItalic ?? false,
          content: b.content ?? null,
        })),
      };
      if (editingTemplateId) {
        await blockTemplatesApi.update(editingTemplateId, payload);
      } else {
        await blockTemplatesApi.create(payload);
      }

      setShowBuilderModal(false);
      setEditingTemplateId(null);
      setBuilderName("");
      setBuilderDescription("");
      refetch();
    } catch (err) {
      setBuilderError(
        err instanceof Error ? err.message : "Could not save the template. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return {
    showBuilderModal,
    setShowBuilderModal,
    editingTemplateId,
    builderChannel,
    builderName,
    setBuilderName,
    builderDescription,
    setBuilderDescription,
    builderTheme,
    setBuilderTheme,
    builderError,
    setBuilderError,
    isSaving,
    blocks,
    constraints,
    deleteTemplateItem,
    setDeleteTemplateItem,
    isDeleting,
    handleOpenCreateModal,
    handleEditTemplate,
    handleDeleteConfirm,
    addBlock,
    updateBlock,
    removeBlock,
    reorderBlocks,
    isSaveDisabled,
    handleSaveTemplate,
  };
}
