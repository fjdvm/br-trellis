import React from "react";
import { PanelTop } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export interface BannerFields {
  message: string;
  imageUrl: string;
  linkUrl: string;
  dismissible: boolean;
}

export function BannerFixedPreview({ fields }: { fields: BannerFields }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-slate-100 dark:bg-slate-950 p-4 space-y-3">
      <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-400 truncate">
          store.example.com
        </span>
      </div>
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

export function BannerBuilderForm({
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
