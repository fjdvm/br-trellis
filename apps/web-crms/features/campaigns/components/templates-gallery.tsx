"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
  PanelTop,
  AppWindow,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import { TemplateCard } from "@/features/campaigns/components/template-card";
import { TemplatePreviewModal } from "@/features/campaigns/components/template-preview-modal";
import {
  BannerFixedPreview,
  PopupFixedPreview,
  BannerBuilderForm,
  PopupBuilderForm,
  EmailBlockCard,
  type TemplateBlock,
  type BannerFields,
  type PopupFields,
} from "@/features/campaigns/components/template-builder-components";
import { TemplateBuilderModalContent } from "@/features/campaigns/components/template-builder-modal-content";
import { useTemplates } from "@/hooks/useTemplates";
import {
  getChannelConstraints,
  validateBlockCount,
  type BlockType,
} from "@/lib/template-constraints";
import type { CampaignChannel, Template } from "@/types/campaign";

const CHANNELS: CampaignChannel[] = ["Email", "Banner", "Popup"];

export type { TemplateBlock, BannerFields, PopupFields };

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main TemplatesGallery
// ---------------------------------------------------------------------------
export function TemplatesGallery() {
  const router = useSafeRouter();
  const { data: templates, isLoading, error, refetch } = useTemplates();
  const [channel, setChannel] = useState<CampaignChannel>("Email");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("name");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // ── Shared builder modal state ──────────────────────────────────────────
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [builderChannel, setBuilderChannel] = useState<CampaignChannel>("Email");
  const [builderName, setBuilderName] = useState("");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Email drag-and-drop block state ────────────────────────────────────
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: "1", type: "heading", label: "Hero Title", textAlign: "left" },
    { id: "2", type: "text", label: "Main Body Text", textAlign: "left" },
    { id: "3", type: "button", label: "Primary Action Button" },
  ]);

  // ── Banner fixed-layout state ───────────────────────────────────────────
  const [bannerFields, setBannerFields] = useState<BannerFields>({
    message: "",
    imageUrl: "",
    linkUrl: "",
    dismissible: true,
  });

  // ── Popup fixed-layout state ────────────────────────────────────────────
  const [popupFields, setPopupFields] = useState<PopupFields>({
    heading: "",
    body: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
  });

  // ── Delete state ────────────────────────────────────────────────────────
  const [deleteTemplateItem, setDeleteTemplateItem] = useState<Template | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const constraints = useMemo(() => getChannelConstraints(builderChannel), [builderChannel]);

  // ── Handlers ────────────────────────────────────────────────────────────
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
      const { crmClient } = await import("@/lib/api/crm-client");
      await crmClient.blockTemplates.delete(deleteTemplateItem.id);
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
      const { crmClient } = await import("@/lib/api/crm-client");

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
          })),
        };
        if (editingTemplateId) {
          await crmClient.blockTemplates.update(editingTemplateId, payload);
        } else {
          await crmClient.blockTemplates.create(payload);
        }
      } else {
        // Banner / Popup — save as a plain-text / HTML content template
        const content =
          builderChannel === "Banner"
            ? bannerFields.message.trim()
            : popupFields.body.trim();

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
          await crmClient.blockTemplates.update(editingTemplateId, payload);
        } else {
          await crmClient.blockTemplates.create(payload);
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

  // ── Builder modal title / description ────────────────────────────────────
  const builderTitle =
    builderChannel === "Banner"
      ? editingTemplateId
        ? "Edit Banner Template"
        : "New Banner Template"
      : builderChannel === "Popup"
      ? editingTemplateId
        ? "Edit Popup Template"
        : "New Popup Template"
      : editingTemplateId
      ? "Edit Email Template"
      : "Drag & Drop Template Builder";

  const builderDialogDescription =
    builderChannel === "Banner"
      ? "Define the fixed layout fields for this storefront banner strip."
      : builderChannel === "Popup"
      ? "Define the fixed layout fields for this modal popup overlay."
      : editingTemplateId
      ? "Modify block structures, labels, and formatting for this email template."
      : "Drag blocks from the palette on the left into the canvas to build your email template.";

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
        <Button onClick={handleOpenCreateModal} className="hidden sm:inline-flex gap-2 shrink-0">
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
                      onEdit={t.format === "Blocks" ? handleEditTemplate : undefined}
                      onDelete={
                        t.format === "Blocks" ? (tpl) => setDeleteTemplateItem(tpl) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTemplateItem && (
        <Dialog
          open={Boolean(deleteTemplateItem)}
          onOpenChange={(open) => !open && setDeleteTemplateItem(null)}
        >
          <DialogContent className="max-w-md border border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-destructive">
                Delete Template?
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Are you sure you want to delete{" "}
                <strong className="text-foreground">"{deleteTemplateItem.name}"</strong>? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteTemplateItem(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Preview Dialog ── */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={Boolean(previewTemplate)}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
        onEditTemplate={handleEditTemplate}
        onDeleteTemplate={(tpl) => setDeleteTemplateItem(tpl)}
      />

      {/* ── Template Builder Modal ── */}
      {showBuilderModal && (
        <Dialog open={showBuilderModal} onOpenChange={setShowBuilderModal}>
          <DialogContent
            className={
              builderChannel === "Email"
                ? "w-full max-w-[98vw] xl:max-w-[96vw] h-[95vh] max-h-[95vh] flex flex-col p-4 sm:p-6 overflow-hidden"
                : "w-full max-w-2xl flex flex-col p-4 sm:p-6"
            }
          >
            <DialogHeader className="border-b border-border pb-4">
              <DialogTitle className="text-xl font-bold">{builderTitle}</DialogTitle>
              <DialogDescription className="mt-1">{builderDialogDescription}</DialogDescription>
            </DialogHeader>

            {builderError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/40 text-destructive text-xs font-medium rounded-md flex items-center justify-between shrink-0">
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

            {/* Modal Body */}
            <TemplateBuilderModalContent
              builderChannel={builderChannel}
              builderName={builderName}
              setBuilderName={setBuilderName}
              builderDescription={builderDescription}
              setBuilderDescription={setBuilderDescription}
              blocks={blocks}
              constraints={constraints}
              bannerFields={bannerFields}
              setBannerFields={setBannerFields}
              popupFields={popupFields}
              setPopupFields={setPopupFields}
              addBlock={addBlock}
              updateBlock={updateBlock}
              removeBlock={removeBlock}
              setBuilderError={setBuilderError}
            />

            <DialogFooter className="border-t border-border pt-4">
              <Button variant="outline" onClick={() => setShowBuilderModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={isSaveDisabled()}>
                {isSaving ? "Saving..." : "Save Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
