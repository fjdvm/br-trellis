import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BannerFixedPreview,
  PopupFixedPreview,
  BannerBuilderForm,
  PopupBuilderForm,
  type TemplateBlock,
  type BannerFields,
  type PopupFields,
} from "@/features/campaigns/components/template-builder-components";
import { EmailBuilderContent } from "@/features/campaigns/components/email-builder-content";
import type { BlockType, ChannelConstraints } from "@/lib/template-constraints";
import type { CampaignChannel } from "@/types/campaign";

interface TemplateBuilderModalContentProps {
  builderChannel: CampaignChannel;
  builderName: string;
  setBuilderName: (v: string) => void;
  builderDescription: string;
  setBuilderDescription: (v: string) => void;
  blocks: TemplateBlock[];
  constraints: ChannelConstraints;
  bannerFields: BannerFields;
  setBannerFields: React.Dispatch<React.SetStateAction<BannerFields>>;
  popupFields: PopupFields;
  setPopupFields: React.Dispatch<React.SetStateAction<PopupFields>>;
  addBlock: (type: BlockType) => void;
  updateBlock: (id: string, patch: Partial<TemplateBlock>) => void;
  removeBlock: (id: string) => void;
  setBuilderError: (msg: string | null) => void;
}

export function TemplateBuilderModalContent({
  builderChannel,
  builderName,
  setBuilderName,
  builderDescription,
  setBuilderDescription,
  blocks,
  constraints,
  bannerFields,
  setBannerFields,
  popupFields,
  setPopupFields,
  addBlock,
  updateBlock,
  removeBlock,
  setBuilderError,
}: TemplateBuilderModalContentProps) {
  if (builderChannel === "Banner") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
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
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            Live Preview
          </Label>
          <BannerFixedPreview fields={bannerFields} />
        </div>
      </div>
    );
  }

  if (builderChannel === "Popup") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
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
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            Live Preview
          </Label>
          <PopupFixedPreview fields={popupFields} />
        </div>
      </div>
    );
  }

  return (
    <EmailBuilderContent
      builderName={builderName}
      setBuilderName={setBuilderName}
      builderDescription={builderDescription}
      setBuilderDescription={setBuilderDescription}
      blocks={blocks}
      constraints={constraints}
      addBlock={addBlock}
      updateBlock={updateBlock}
      removeBlock={removeBlock}
      setBuilderError={setBuilderError}
    />
  );
}

