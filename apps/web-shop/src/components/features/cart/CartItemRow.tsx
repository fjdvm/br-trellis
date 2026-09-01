"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CartItemDto } from "@/types/cart";

interface CartItemRowProps {
  item: CartItemDto;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  selected?: boolean;
  onToggleSelected?: (id: string) => void;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  selected,
  onToggleSelected,
}: CartItemRowProps) {
  const imageUrl = item.images?.[0] || DEFAULT_IMAGE;
  const showSelection = typeof onToggleSelected === "function";

  const handleContainerClick = () => {
    if (showSelection) onToggleSelected?.(item.id);
  };

  // Stops a click on an interactive control (checkbox, quantity, remove) from
  // bubbling up to the container's selection toggle.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={handleContainerClick}
      className={`flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-surface-container-low rounded-none border transition-all duration-300 ${
        showSelection ? "cursor-pointer" : ""
      } ${
        showSelection && !selected
          ? "border-outline-variant/30 opacity-60"
          : "border-outline-variant/30"
      }`}
    >
      {showSelection && (
        <Checkbox
          checked={selected}
          onClick={stop}
          onCheckedChange={() => onToggleSelected?.(item.id)}
          aria-label={`Select ${item.productName} for checkout`}
          className="mt-1 md:mt-0 shrink-0"
        />
      )}

      <div className="relative w-full md:w-32 h-32 rounded-none overflow-hidden bg-surface-variant shrink-0 border border-outline-variant/20 flex items-center justify-center">
        <Image
          src={imageUrl}
          alt={item.productName}
          fill
          unoptimized
          className="object-contain w-3/4 h-3/4"
        />
      </div>

      <div className="flex-grow flex flex-col gap-2 w-full">
        <div className="flex justify-between items-start w-full gap-2">
          <div>
            <h3 className="font-serif font-bold text-xl text-on-surface line-clamp-1">{item.productName}</h3>
            <p className="label-upper text-on-surface-variant mt-1">
              ${item.unitPrice.toFixed(2)} each
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              stop(e);
              onRemove(item.id);
            }}
            aria-label="Remove item"
            className="text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-none shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div onClick={stop} className="flex items-center border border-outline-variant/40 rounded-none p-1 bg-surface shadow-2xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none hover:bg-surface-container-highest transition-colors text-on-surface"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="font-sans font-medium text-sm px-3 text-on-surface min-w-[24px] text-center">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none hover:bg-surface-container-highest transition-colors text-on-surface"
              disabled={item.quantity >= item.stock}
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <span className="font-serif font-bold text-xl text-primary">
            ${item.totalPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
