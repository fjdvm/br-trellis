"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TemplateBuilderModalContent } from "@/features/campaigns/components/template-builder-modal-content";
import type { CampaignChannel } from "@/features/campaigns/types";
import type { TemplateBlock, BannerFields, PopupFields } from "@/features/campaigns/components/template-builder-components";
import type { ChannelConstraints, BlockType } from "@/features/campaigns/services/template-constraints";

export interface TemplateBuilderModalProps {
  showBuilderModal: boolean;
  setShowBuilderModal: (open: boolean) => void;
  editingTemplateId: string | null;
  builderChannel: CampaignChannel;
  builderName: string;
  setBuilderName: (name: string) => void;
  builderDescription: string;
  setBuilderDescription: (desc: string) => void;
  builderError: string | null;
  setBuilderError: (err: string | null) => void;
  blocks: TemplateBlock[];
  constraints: ChannelConstraints;
  bannerFields: BannerFields;
  setBannerFields: React.Dispatch<React.SetStateAction<BannerFields>>;
  popupFields: PopupFields;
  setPopupFields: React.Dispatch<React.SetStateAction<PopupFields>>;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  handleSaveTemplate: () => void;
  isSaveDisabled: () => boolean;
  isSaving: boolean;
}

export function TemplateBuilderModal({
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
  blocks,
  constraints,
  bannerFields,
  setBannerFields,
  popupFields,
  setPopupFields,
  addBlock,
  updateBlock,
  removeBlock,
  handleSaveTemplate,
  isSaveDisabled,
  isSaving,
}: TemplateBuilderModalProps) {
  if (!showBuilderModal) return null;

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

  return (
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
  );
}
