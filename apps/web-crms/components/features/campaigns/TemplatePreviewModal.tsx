"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StorefrontLivePreview } from "@/components/features/campaigns/StorefrontLivePreview";
import type { Template } from "@/types/campaign";

interface TemplatePreviewModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: Template) => void;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {template.name}
              <Badge variant="secondary">{template.channel}</Badge>
            </DialogTitle>
            <DialogDescription className="mt-1">
              {template.description || "System preset communication framework."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Live Storefront Presentation Frame */}
        <div className="flex-1 overflow-y-auto my-4">
          <StorefrontLivePreview
            channel={template.channel}
            content={{
              subject: template.channel === "Email" ? template.name : undefined,
              heading: template.channel === "Popup" ? template.name : undefined,
              body: template.content,
              linkUrl: template.channel === "Banner" ? "#" : undefined,
              ctaText: template.channel === "Popup" ? "Claim Special Offer" : undefined,
            }}
            liveBadgeText="TEMPLATE PREVIEW"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
