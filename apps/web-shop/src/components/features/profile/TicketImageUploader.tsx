"use client";

import { type ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

export interface ImageFileItem {
  file: File;
  previewUrl: string;
}

interface TicketImageUploaderProps {
  images: ImageFileItem[];
  onChange: (images: ImageFileItem[]) => void;
  disabled?: boolean;
}

export function TicketImageUploader({
  images,
  onChange,
  disabled,
}: TicketImageUploaderProps) {
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const newPreviews = selectedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...images, ...newPreviews].slice(0, 5));
  };

  const removeImage = (index: number) => {
    const next = [...images];
    URL.revokeObjectURL(next[index].previewUrl);
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-foreground flex items-center justify-between">
        <span>Upload Pictures (Optional)</span>
        <span className="text-[11px] text-muted-foreground font-normal">Max 5 photos</span>
      </Label>

      <div className="border-2 border-dashed border-border rounded-lg p-3 text-center bg-surface-low hover:bg-slate-50 transition-colors">
        <input
          type="file"
          id="ticket-pictures"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageChange}
          disabled={disabled || images.length >= 5}
        />
        <label
          htmlFor="ticket-pictures"
          className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-1"
        >
          <Upload className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            Click to select photos
          </span>
          <span className="text-[10px] text-muted-foreground">
            PNG, JPG, WEBP up to 5MB each
          </span>
        </label>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative w-14 h-14 rounded-md overflow-hidden border border-border group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`Upload preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-black/60 text-white hover:bg-destructive transition-colors"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
