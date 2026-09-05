import { useMemo } from "react";
import type { BlockValue, ChannelContentState } from "@/features/campaigns/components/channel-content-form";
import type { ParsedBlock } from "@/features/campaigns/components/channel-form-block-fields";

export function useLivePreviewContent(
  isBlockTemplate: boolean,
  parsedBlocks: ParsedBlock[],
  value: ChannelContentState
) {
  return useMemo(() => {
    if (!isBlockTemplate || parsedBlocks.length === 0) return value;

    const previewBlocks = parsedBlocks.map((block) => ({
      type: block.type,
      label: block.label,
      textAlign: block.textAlign,
      isBold: block.isBold,
      isItalic: block.isItalic,
      content: value.blockValues?.[block.id] ?? "",
    }));

    const firstHeading = parsedBlocks.find((b) => b.type === "heading");
    const firstButton = parsedBlocks.find((b) => b.type === "button");
    const firstImage = parsedBlocks.find((b) => b.type === "image");

    const headingVal =
      firstHeading && typeof value.blockValues?.[firstHeading.id] === "string"
        ? (value.blockValues[firstHeading.id] as string)
        : undefined;

    const btnVal =
      firstButton &&
      value.blockValues?.[firstButton.id] &&
      typeof value.blockValues[firstButton.id] === "object" &&
      !Array.isArray(value.blockValues[firstButton.id]) &&
      "text" in (value.blockValues[firstButton.id] as object)
        ? (value.blockValues[firstButton.id] as { text: string; url: string })
        : null;

    const imgVal =
      firstImage &&
      value.blockValues?.[firstImage.id] &&
      typeof value.blockValues[firstImage.id] === "object" &&
      !Array.isArray(value.blockValues[firstImage.id]) &&
      "url" in (value.blockValues[firstImage.id] as object)
        ? (value.blockValues[firstImage.id] as { url: string; alt: string })
        : null;

    return {
      ...value,
      body: JSON.stringify(previewBlocks),
      heading: headingVal || value.heading,
      ctaText: btnVal?.text || value.ctaText,
      ctaUrl: btnVal?.url || value.ctaUrl,
      imageUrl: imgVal?.url || value.imageUrl,
    };
  }, [isBlockTemplate, parsedBlocks, value]);
}
