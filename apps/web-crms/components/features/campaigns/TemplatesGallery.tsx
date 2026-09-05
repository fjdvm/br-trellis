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
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
}

/** Fixed field state for Banner templates */
interface BannerFields {
  message: string;
  imageUrl: string;
  linkUrl: string;
  dismissible: boolean;
}

/** Fixed field state for Popup templates */
interface PopupFields {
  heading: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fixed-layout preview: Banner
// ---------------------------------------------------------------------------
function BannerFixedPreview({ fields }: { fields: BannerFields }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-950 p-4 space-y-3">
      {/* mock browser chrome */}
      <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-400 truncate">
          store.example.com
        </span>
      </div>

      {/* banner strip */}
      <div className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground rounded-lg px-4 py-3 flex items-center gap-3">
        {fields.imageUrl ? (
          <img
            src={fields.imageUrl}
            alt=""
            className="w-8 h-8 rounded object-cover shrink-0 border border-primary-foreground/20"
          />
        ) : (
          <PanelTop className="w-4 h-4 shrink-0 opacity-80" />
        )}
        <p className="flex-1 text-xs font-medium leading-snug truncate">
          {fields.message || "Your promotional message will appear here…"}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {fields.linkUrl && (
            <span className="text-[11px] font-bold underline bg-primary-foreground/10 px-2 py-1 rounded cursor-pointer">
              Learn More
            </span>
          )}
          {fields.dismissible && (
            <span className="text-primary-foreground/70 text-xs leading-none">✕</span>
          )}
        </div>
      </div>

      {/* mock storefront skeleton */}
      <div className="space-y-2 opacity-50">
        <div className="h-4 w-3/4 rounded bg-muted-foreground/20" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded bg-muted/60" />
          <div className="h-14 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fixed-layout preview: Popup
// ---------------------------------------------------------------------------
function PopupFixedPreview({ fields }: { fields: PopupFields }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-950 p-4 space-y-3">
      {/* mock browser chrome */}
      <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-400 truncate">
          store.example.com
        </span>
      </div>

      {/* dimmed page + modal */}
      <div className="relative rounded-md overflow-hidden">
        {/* bg page skeleton */}
        <div className="space-y-2 p-3 opacity-40">
          <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 rounded bg-muted/70" />
            <div className="h-12 rounded bg-muted/70" />
          </div>
        </div>
        {/* backdrop */}
        <div className="absolute inset-0 bg-slate-950/55 rounded-md" />
        {/* modal card */}
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <div className="w-full bg-card border border-border rounded-xl shadow-2xl p-4 space-y-3 text-center">
            {fields.imageUrl && (
              <div className="w-full h-16 rounded-lg bg-muted overflow-hidden">
                <img
                  src={fields.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <p className="text-sm font-bold text-foreground leading-tight">
              {fields.heading || "Popup Heading"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {fields.body || "Your popup body message will appear here…"}
            </p>
            {(fields.ctaText || fields.ctaUrl) && (
              <div className="pt-1">
                <span className="block w-full py-1.5 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
                  {fields.ctaText || "Learn More"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fixed-layout form: Banner
// ---------------------------------------------------------------------------
function BannerBuilderForm({
  fields,
  onChange,
}: {
  fields: BannerFields;
  onChange: (patch: Partial<BannerFields>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="banner-message" className="text-sm font-semibold">
          Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="banner-message"
          placeholder="e.g. Free shipping on orders over $50 — today only!"
          value={fields.message}
          onChange={(e) => onChange({ message: e.target.value })}
          className="min-h-[80px] resize-none text-base"
        />
        <p className="text-xs text-muted-foreground">
          Keep it short — banners display a single line of text.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="banner-image" className="text-sm font-semibold">
            Image URL{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="banner-image"
            placeholder="https://cdn.example.com/promo.jpg"
            value={fields.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="banner-link" className="text-sm font-semibold">
            Link URL{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="banner-link"
            placeholder="https://store.example.com/deals"
            value={fields.linkUrl}
            onChange={(e) => onChange({ linkUrl: e.target.value })}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <Checkbox
          id="banner-dismissible"
          checked={fields.dismissible}
          onCheckedChange={(v) => onChange({ dismissible: v === true })}
        />
        <div>
          <span className="text-sm font-semibold">Dismissible</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Show a close button so visitors can hide the banner.
          </p>
        </div>
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fixed-layout form: Popup
// ---------------------------------------------------------------------------
function PopupBuilderForm({
  fields,
  onChange,
}: {
  fields: PopupFields;
  onChange: (patch: Partial<PopupFields>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="popup-heading" className="text-sm font-semibold">
          Heading <span className="text-destructive">*</span>
        </Label>
        <Input
          id="popup-heading"
          placeholder="e.g. Exclusive Members-Only Offer"
          value={fields.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="popup-body" className="text-sm font-semibold">
          Body Message <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="popup-body"
          placeholder="e.g. Get 20% off your next order when you sign up for our newsletter."
          value={fields.body}
          onChange={(e) => onChange({ body: e.target.value })}
          className="min-h-[90px] resize-none text-base"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="popup-image" className="text-sm font-semibold">
          Image URL{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="popup-image"
          placeholder="https://cdn.example.com/popup-hero.jpg"
          value={fields.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Displayed as a hero image at the top of the popup.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="popup-cta-text" className="text-sm font-semibold">
            CTA Button Text
          </Label>
          <Input
            id="popup-cta-text"
            placeholder="e.g. Shop Now"
            value={fields.ctaText}
            onChange={(e) => onChange({ ctaText: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="popup-cta-url" className="text-sm font-semibold">
            CTA Link URL
          </Label>
          <Input
            id="popup-cta-url"
            placeholder="https://store.example.com/offers"
            value={fields.ctaUrl}
            onChange={(e) => onChange({ ctaUrl: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
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
        <Button onClick={handleOpenCreateModal} className="gap-2 shrink-0">
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
                ? "w-full max-w-[95vw] sm:max-w-[92vw] lg:max-w-7xl h-[92vh] max-h-[92vh] flex flex-col p-4 sm:p-6 overflow-hidden"
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

            {/* ────── EMAIL: Drag-and-Drop Builder ────── */}
            {builderChannel === "Email" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden my-4">
                {/* 1. Palette */}
                <div className="lg:col-span-3 bg-muted/40 border border-border rounded-lg p-4 space-y-4 flex flex-col min-h-0 overflow-y-auto">
                  <div className="space-y-2">
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
                      {(
                        [
                          {
                            type: "carousel" as const,
                            label: "Carousel",
                            icon: SlidersHorizontal,
                            max: constraints.maxCarousel,
                          },
                          {
                            type: "image" as const,
                            label: "Image Placeholder",
                            icon: Image,
                            max: constraints.maxImages,
                          },
                          {
                            type: "link" as const,
                            label: "Text Link",
                            icon: LinkIcon,
                            max: constraints.maxLinks,
                          },
                          {
                            type: "heading" as const,
                            label: "Heading Title",
                            icon: Type,
                            max: constraints.maxHeadings,
                          },
                          {
                            type: "text" as const,
                            label: "Text Paragraph",
                            icon: AlignLeft,
                            max: constraints.maxTexts,
                          },
                          {
                            type: "button" as const,
                            label: "CTA Button",
                            icon: MousePointerClick,
                            max: constraints.maxButtons,
                          },
                        ] as const
                      )
                        .filter((item) => item.max > 0)
                        .map((item) => {
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
                                  setBuilderError(
                                    `Email allows max ${item.max} ${item.label}(s).`
                                  );
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
                                <Badge
                                  variant={count >= item.max ? "destructive" : "secondary"}
                                  className="text-[9px] px-1.5 py-0"
                                >
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

                {/* 2. Drag and Drop Canvas */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData("text/plain");
                    if (type) addBlock(type as BlockType);
                  }}
                  className="lg:col-span-6 bg-slate-100 dark:bg-slate-950 border-2 border-dashed border-border rounded-xl p-4 flex flex-col justify-between overflow-y-auto min-h-[380px]"
                >
                  <div className="space-y-3">
                    {/* Canvas Frame Header */}
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

                    {/* Email envelope wrapper */}
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
                        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2 border border-dashed border-border/60 rounded-lg">
                          <GripVertical className="w-6 h-6 opacity-40 animate-bounce" />
                          <p>Drag and drop elements here to compose content</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {blocks.map((block) => (
                            <EmailBlockCard
                              key={block.id}
                              block={block}
                              onUpdate={(patch) => updateBlock(block.id, patch)}
                              onRemove={() => removeBlock(block.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-end gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => addBlock("text")}
                    >
                      + Add Block
                    </Button>
                  </div>
                </div>

                {/* 3. Clean Unconfigured Component Preview */}
                <div className="lg:col-span-3 bg-background border border-border rounded-xl p-4 flex flex-col justify-between overflow-y-auto min-h-[380px] shadow-sm">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="bg-slate-900 text-slate-200 p-2.5 px-3 rounded-lg border border-slate-800 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="font-mono text-xs text-slate-300 ml-1">
                          Live Render Preview
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Clean Output
                      </span>
                    </div>

                    {/* Email output card */}
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
                        <div className="h-36 flex flex-col items-center justify-center text-muted-foreground text-xs border border-dashed rounded-md p-4 text-center">
                          No components added yet. Add blocks from the palette to see how they render.
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          {blocks.map((block) => {
                            const alignClass =
                              block.textAlign === "center"
                                ? "text-center justify-center items-center"
                                : block.textAlign === "right"
                                ? "text-right justify-end items-end"
                                : "text-left justify-start items-start";

                            const fontStyle = `${block.isBold ? "font-bold" : ""} ${block.isItalic ? "italic" : ""}`.trim();

                            if (block.type === "heading") {
                              return (
                                <h3
                                  key={block.id}
                                  className={`text-base font-bold text-foreground ${alignClass} ${fontStyle}`}
                                >
                                  {block.label || "Heading Title"}
                                </h3>
                              );
                            }

                            if (block.type === "text") {
                              return (
                                <p
                                  key={block.id}
                                  className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap ${alignClass} ${fontStyle}`}
                                >
                                  {block.label || "Paragraph text content will render here."}
                                </p>
                              );
                            }

                            if (block.type === "button") {
                              return (
                                <div key={block.id} className={`pt-1 flex ${alignClass}`}>
                                  <span className="inline-block py-2 px-4 bg-primary text-primary-foreground text-xs font-semibold rounded shadow-xs cursor-pointer hover:opacity-90 transition-opacity">
                                    {block.label || "CTA Action Button"}
                                  </span>
                                </div>
                              );
                            }

                            if (block.type === "image") {
                              return (
                                <div
                                  key={block.id}
                                  className="w-full h-28 bg-muted rounded-lg flex flex-col items-center justify-center text-xs text-muted-foreground font-medium border border-dashed border-border gap-1"
                                >
                                  <Image className="w-6 h-6 text-primary opacity-80" />
                                  <span>{block.label || "Image Component Placeholder"}</span>
                                </div>
                              );
                            }

                            if (block.type === "link") {
                              return (
                                <div key={block.id} className={`text-xs text-primary underline font-medium cursor-pointer ${alignClass}`}>
                                  {block.label || "Text Link Anchor"}
                                </div>
                              );
                            }

                            if (block.type === "carousel") {
                              return (
                                <div
                                  key={block.id}
                                  className="w-full h-24 bg-muted/70 rounded-lg flex items-center justify-center text-xs text-muted-foreground font-semibold border border-dashed border-border gap-2"
                                >
                                  <SlidersHorizontal className="w-5 h-5 text-primary opacity-80" />
                                  <span>🎠 Carousel ({block.label || "3 Slides"})</span>
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────── BANNER: Fixed Layout ────── */}
            {builderChannel === "Banner" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
                {/* Left: settings + form */}
                <div className="space-y-5">
                  <div className="space-y-3 pb-4 border-b border-border">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Template Settings
                    </Label>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="banner-name" className="text-sm font-semibold">
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="banner-name"
                          placeholder="Template name..."
                          value={builderName}
                          onChange={(e) => setBuilderName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="banner-desc" className="text-sm font-semibold">
                          Description{" "}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="banner-desc"
                          placeholder="Short description..."
                          value={builderDescription}
                          onChange={(e) => setBuilderDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <BannerBuilderForm
                    fields={bannerFields}
                    onChange={(patch) => setBannerFields((prev) => ({ ...prev, ...patch }))}
                  />
                </div>

                {/* Right: live preview */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Live Preview
                  </Label>
                  <BannerFixedPreview fields={bannerFields} />
                </div>
              </div>
            )}

            {/* ────── POPUP: Fixed Layout ────── */}
            {builderChannel === "Popup" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
                {/* Left: settings + form */}
                <div className="space-y-5">
                  <div className="space-y-3 pb-4 border-b border-border">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                      Template Settings
                    </Label>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-name" className="text-sm font-semibold">
                          Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="popup-name"
                          placeholder="Template name..."
                          value={builderName}
                          onChange={(e) => setBuilderName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="popup-desc" className="text-sm font-semibold">
                          Description{" "}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="popup-desc"
                          placeholder="Short description..."
                          value={builderDescription}
                          onChange={(e) => setBuilderDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <PopupBuilderForm
                    fields={popupFields}
                    onChange={(patch) => setPopupFields((prev) => ({ ...prev, ...patch }))}
                  />
                </div>

                {/* Right: live preview */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                    Live Preview
                  </Label>
                  <PopupFixedPreview fields={popupFields} />
                </div>
              </div>
            )}

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

// ---------------------------------------------------------------------------
// Email block card (extracted to keep the main component clean)
// ---------------------------------------------------------------------------
function EmailBlockCard({
  block,
  onUpdate,
  onRemove,
}: {
  block: TemplateBlock;
  onUpdate: (patch: Partial<TemplateBlock>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative group bg-card border border-border p-4 rounded-lg shadow-sm space-y-3 text-left">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <Badge variant="outline" className="uppercase text-[10px] font-semibold tracking-wider">
          {block.type}
        </Badge>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Block Label</Label>
        <Input
          placeholder="e.g. Hero Headline, Main Body Text, Action CTA"
          value={block.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="text-sm font-medium"
        />
      </div>

      {/* Formatting + Alignment Toolbar */}
      <div className="flex items-center justify-between bg-muted/50 border border-border p-1.5 rounded-md">
        <div className="flex items-center gap-1">
          {(block.type === "heading" || block.type === "text") && (
            <>
              <button
                type="button"
                title="Bold"
                onClick={() => onUpdate({ isBold: !block.isBold })}
                className={`p-1 rounded text-xs transition-colors ${
                  block.isBold
                    ? "bg-background text-primary shadow-xs font-bold"
                    : "hover:bg-background text-foreground"
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Italic"
                onClick={() => onUpdate({ isItalic: !block.isItalic })}
                className={`p-1 rounded text-xs transition-colors ${
                  block.isItalic
                    ? "bg-background text-primary shadow-xs italic"
                    : "hover:bg-background text-foreground"
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <span className="text-[11px] font-medium text-muted-foreground ml-1">Alignment:</span>
        </div>
        <div className="flex items-center gap-1">
          {(
            [
              { align: "left", Icon: AlignLeft },
              { align: "center", Icon: AlignCenter },
              { align: "right", Icon: AlignRight },
            ] as const
          ).map(({ align, Icon }) => (
            <button
              key={align}
              type="button"
              title={`Align ${align}`}
              onClick={() => onUpdate({ textAlign: align })}
              className={`p-1 px-2 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                (block.textAlign || "left") === align
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:bg-background"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{align}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Block type indicator */}
      <BlockTypeIndicator type={block.type} />
    </div>
  );
}

function BlockTypeIndicator({ type }: { type: BlockType }) {
  const map: Record<BlockType, { icon: React.ReactNode; label: string }> = {
    heading: { icon: <Type className="w-4 h-4 text-primary" />, label: "Heading Title Structural Block" },
    text: { icon: <AlignLeft className="w-4 h-4 text-primary" />, label: "Paragraph Text Structural Block" },
    carousel: { icon: <SlidersHorizontal className="w-4 h-4 text-primary" />, label: "Carousel Structural Block (Max 3 images)" },
    image: { icon: <Image className="w-4 h-4 text-primary" />, label: "Image Component Structural Block" },
    link: { icon: <LinkIcon className="w-4 h-4 text-primary" />, label: "Text Link Structural Block" },
    button: { icon: <MousePointerClick className="w-4 h-4 text-primary" />, label: "CTA Button Structural Block" },
  };
  const item = map[type];
  if (!item) return null;
  return (
    <div className="p-3 bg-muted/40 border border-dashed border-border rounded-md text-xs text-muted-foreground font-semibold flex items-center justify-between">
      {item.icon}
      <span>{item.label}</span>
    </div>
  );
}
