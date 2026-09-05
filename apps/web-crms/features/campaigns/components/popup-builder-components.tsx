import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface PopupFields {
  heading: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export function PopupFixedPreview({ fields }: { fields: PopupFields }) {
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
      <div className="relative rounded-md overflow-hidden">
        <div className="space-y-2 p-3 opacity-40">
          <div className="h-3 w-2/3 rounded bg-muted-foreground/30" />
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 rounded bg-muted/70" />
            <div className="h-12 rounded bg-muted/70" />
          </div>
        </div>
        <div className="absolute inset-0 bg-slate-950/55 rounded-md" />
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

export function PopupBuilderForm({
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
