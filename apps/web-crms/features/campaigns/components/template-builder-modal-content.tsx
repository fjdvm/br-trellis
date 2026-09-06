import React from "react";
import type { TemplateBlock } from "@/features/campaigns/components/template-builder-components";
import { EmailBuilderContent } from "@/features/campaigns/components/email-builder-content";
import type { BlockType, ChannelConstraints } from "@/features/campaigns/services/template-constraints";
import type { EmailTheme } from "@/features/campaigns/types/block-template";

interface TemplateBuilderModalContentProps {
  builderName: string;
  setBuilderName: (v: string) => void;
  builderDescription: string;
  setBuilderDescription: (v: string) => void;
  builderTheme: EmailTheme;
  setBuilderTheme: (v: EmailTheme) => void;
  blocks: TemplateBlock[];
  constraints: ChannelConstraints;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (activeId: string, overId: string) => void;
  setBuilderError: (msg: string | null) => void;
}

export function TemplateBuilderModalContent({
  builderName,
  setBuilderName,
  builderDescription,
  setBuilderDescription,
  builderTheme,
  setBuilderTheme,
  blocks,
  constraints,
  addBlock,
  updateBlock,
  removeBlock,
  reorderBlocks,
  setBuilderError,
}: TemplateBuilderModalContentProps) {
  return (
    <EmailBuilderContent
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
  );
}
