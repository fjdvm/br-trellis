import { useMemo, useState } from "react";
import { blockTemplatesApi } from "@/features/campaigns/services/campaigns-api";
import { validateBlockCount, getChannelConstraints, type BlockType, type ChannelConstraints } from "@/features/campaigns/services/template-constraints";
import type { CampaignChannel, Template } from "@/features/campaigns/types";
import type { TemplateBlock, BannerFields, PopupFields } from "@/features/campaigns/components/template-builder-components";

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
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: "1", type: "heading", label: "Hero Title", textAlign: "left" },
    { id: "2", type: "text", label: "Main Body Text", textAlign: "left" },
    { id: "3", type: "button", label: "Primary Action Button" },
  ]);

  const [bannerFields, setBannerFields] = useState<BannerFields>({
    message: "",
    imageUrl: "",
    linkUrl: "",
    dismissible: true,
  });

  const [popupFields, setPopupFields] = useState<PopupFields>({
    heading: "",
    body: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
  });

  const [deleteTemplateItem, setDeleteTemplateItem] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const constraints = useMemo(() => getChannelConstraints(builderChannel), [builderChannel]);

  function handleOpenCreateModal() {
    setEditingTemplateId(null);
    setBuilderName("");
    setBuilderDescription("");
    setBuilderChannel(channel);
    setBuilderError(null);
    setBlocks([
      { id: "1", type: "heading", label: "Hero Title", textAlign: "left" },
      { id: "2", type: "text", label: "Main Body Text", textAlign: "left" },
      { id: "3", type: "button", label: "Primary Action Button" },
    ]);
    setBannerFields({ message: "", imageUrl: "", linkUrl: "", dismissible: true });
    setPopupFields({ heading: "", body: "", imageUrl: "", ctaText: "", ctaUrl: "" });
    setShowBuilderModal(true);
  }

  function handleEditTemplate(template: Template) {
    setEditingTemplateId(template.id);
    setBuilderName(template.name);
    setBuilderDescription(template.description || "");
    setBuilderChannel(template.channel);
    setBuilderError(null);

    if (template.channel === "Email") {
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
    }

    if (template.channel === "Banner") {
      setBannerFields({
        message: template.content || "",
        imageUrl: "",
        linkUrl: "",
        dismissible: true,
      });
    }

    if (template.channel === "Popup") {
      setPopupFields({
        heading: template.name,
        body: template.content || "",
        imageUrl: "",
        ctaText: "",
        ctaUrl: "",
      });
    }

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

  function isSaveDisabled() {
    if (isSaving) return true;
    if (!builderName.trim()) return true;
    if (builderChannel === "Email") return blocks.length === 0;
    if (builderChannel === "Banner") return !bannerFields.message.trim();
    if (builderChannel === "Popup")
      return !popupFields.heading.trim() || !popupFields.body.trim();
    return false;
  }

  async function handleSaveTemplate() {
    if (!builderName.trim()) {
      setBuilderError("Template name is required.");
      return;
    }

    if (builderChannel === "Email" && blocks.length === 0) {
      setBuilderError("Template must contain at least one block.");
      return;
    }
    if (builderChannel === "Banner" && !bannerFields.message.trim()) {
      setBuilderError("Message is required for Banner templates.");
      return;
    }
    if (builderChannel === "Popup") {
      if (!popupFields.heading.trim() || !popupFields.body.trim()) {
        setBuilderError("Heading and body message are required for Popup templates.");
        return;
      }
    }

    setIsSaving(true);
    setBuilderError(null);

    try {
      if (builderChannel === "Email") {
        const payload = {
          name: builderName.trim(),
          description: builderDescription.trim() || undefined,
          channel: builderChannel,
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
      } else {
        const payload = {
          name: builderName.trim(),
          description: builderDescription.trim() || undefined,
          channel: builderChannel,
          blocks: [] as {
            type: string;
            label: string;
            order: number;
            textAlign: string;
            isBold: boolean;
            isItalic: boolean;
          }[],
        };
        if (editingTemplateId) {
          await blockTemplatesApi.update(editingTemplateId, payload);
        } else {
          await blockTemplatesApi.create(payload);
        }
      }

      setShowBuilderModal(false);
      setEditingTemplateId(null);
      setBuilderName("");
      setBuilderDescription("");
      refetch();
    } catch (err) {
      console.warn("Saving template API error — updating local state:", err);
      setShowBuilderModal(false);
      setEditingTemplateId(null);
      setBuilderName("");
      setBuilderDescription("");
      refetch();
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
    builderError,
    setBuilderError,
    isSaving,
    blocks,
    constraints,
    bannerFields,
    setBannerFields,
    popupFields,
    setPopupFields,
    deleteTemplateItem,
    setDeleteTemplateItem,
    isDeleting,
    handleOpenCreateModal,
    handleEditTemplate,
    handleDeleteConfirm,
    addBlock,
    updateBlock,
    removeBlock,
    isSaveDisabled,
    handleSaveTemplate,
  };
}
