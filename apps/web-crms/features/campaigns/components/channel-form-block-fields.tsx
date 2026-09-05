import React from "react";
import { BlockGroup } from "@/features/campaigns/components/channel-form-fields";
import { BlockContentEditor } from "@/features/campaigns/components/block-content-editor";
import type { BlockValue, ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import type { CampaignChannel } from "@/features/campaigns/types";

export interface ParsedBlock {
  id: string;
  type: string;
  label: string;
  textAlign?: "left" | "center" | "right";
  isBold?: boolean;
  isItalic?: boolean;
  order?: number;
}

interface BlockTemplateFieldsProps {
  channel: CampaignChannel;
  parsedBlocks: ParsedBlock[];
  value: ChannelContentState;
  updateBlockValue: (blockId: string, newVal: BlockValue) => void;
}

export function BlockTemplateFields({
  channel,
  parsedBlocks,
  value,
  updateBlockValue,
}: BlockTemplateFieldsProps) {
  return (
    <div className="space-y-6 pt-2">
      {parsedBlocks.map((block, idx) => {
        const val = value.blockValues?.[block.id];

        function update(newVal: BlockValue) {
          updateBlockValue(block.id, newVal);
        }

        const fieldNumber = idx + 1;
        const labelPrefix = `${fieldNumber}. `;
        const idPrefix = `${channel}-block-${block.id}`;

        if (block.type === "text" || block.type === "heading") {
          return (
            <BlockContentEditor
              key={block.id}
              type={block.type}
              idPrefix={idPrefix}
              value={val}
              onChange={update}
              label={labelPrefix + block.label}
            />
          );
        }

        return (
          <BlockGroup key={block.id} label={labelPrefix + block.label} type={block.type}>
            <BlockContentEditor type={block.type} idPrefix={idPrefix} value={val} onChange={update} />
          </BlockGroup>
        );
      })}
    </div>
  );
}

export { NonBlockTemplateFields } from "@/features/campaigns/components/non-block-template-fields";

