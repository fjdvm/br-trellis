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
import type { TemplateBlock } from "@/features/campaigns/components/template-builder-components";
import type { ChannelConstraints, BlockType } from "@/features/campaigns/services/template-constraints";
import type { EmailTheme } from "@/features/campaigns/types/block-template";

export interface TemplateBuilderModalProps {
  showBuilderModal: boolean;
  setShowBuilderModal: (open: boolean) => void;
  editingTemplateId: string | null;
  builderName: string;
  setBuilderName: (name: string) => void;
  builderDescription: string;
  setBuilderDescription: (desc: string) => void;
  builderTheme: EmailTheme;
  setBuilderTheme: (theme: EmailTheme) => void;
  builderError: string | null;
  setBuilderError: (err: string | null) => void;
  blocks: TemplateBlock[];
  constraints: ChannelConstraints;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  handleSaveTemplate: () => void;
  isSaveDisabled: () => boolean;
  isSaving: boolean;
}

export function TemplateBuilderModal({
  showBuilderModal,
  setShowBuilderModal,
  editingTemplateId,
  builderName,
  setBuilderName,
  builderDescription,
  setBuilderDescription,
  builderTheme,
  setBuilderTheme,
  builderError,
  setBuilderError,
  blocks,
  constraints,
  addBlock,
  updateBlock,
  removeBlock,
  reorderBlocks,
  handleSaveTemplate,
  isSaveDisabled,
  isSaving,
}: TemplateBuilderModalProps) {
  if (!showBuilderModal) return null;

  const builderTitle = editingTemplateId ? "Edit Email Template" : "Drag & Drop Template Builder";

  const builderDialogDescription = editingTemplateId
    ? "Modify block structures, labels, and formatting for this email template."
    : "Drag blocks from the palette on the left into the canvas to build your email template.";

  return (
    <Dialog open={showBuilderModal} onOpenChange={setShowBuilderModal}>
      <DialogContent className="w-full max-w-[98vw] xl:max-w-[96vw] h-[95vh] max-h-[95vh] flex flex-col p-4 sm:p-6 overflow-hidden">
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
          builderName={builderName}
          setBuilderName={setBuilderName}
          builderDescription={builderDescription}
          setBuilderDescription={setBuilderDescription}
          builderTheme={builderTheme}
          setBuilderTheme={setBuilderTheme}
          blocks={blocks}
          constraints={constraints}
          addBlock={addBlock}
          updateBlock={updateBlock}
          removeBlock={removeBlock}
          reorderBlocks={reorderBlocks}
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
