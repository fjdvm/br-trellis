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

        <div className="flex-1 overflow-y-auto my-4 border border-border rounded-lg p-md bg-muted/20">
          <div
            className="prose dark:prose-invert max-w-none text-base"
            dangerouslySetInnerHTML={{ __html: template.content }}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onUseTemplate(template);
            }}
          >
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
