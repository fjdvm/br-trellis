"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Heart, Star, Truck, Leaf, Minus, Plus, ChevronUp } from "lucide-react";
import type { Product } from "@/types/product";
import { useCart } from "@/hooks/useCart";

interface ProductDetailInfoProps {
  product: Product;
}

const CATEGORY_NAMES: Record<number | string, string> = {
  0: "Jams",
  1: "Pastries",
  2: "GiftSets",
  3: "Sweets",
  Jams: "Jams",
  Pastries: "Pastries",
  GiftSets: "GiftSets",
  Sweets: "Sweets",
};

export function ProductDetailInfo({ product }: ProductDetailInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [openHeritage, setOpenHeritage] = useState(false);
  const [openIngredients, setOpenIngredients] = useState(false);

  const { addToCart, loading } = useCart();
  const inStock = product.stock > 0;
  const categoryLabel = CATEGORY_NAMES[product.category] || "Artisanal";

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product.id, quantity);
  };

  return (
    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28 font-sans">
      {/* Category & Badge Header */}
      <div>
        <div className="flex gap-2 mb-3">
          <Badge className="bg-secondary-container text-on-secondary-container border-none px-3.5 py-1 rounded-full label-upper">
            {categoryLabel}
          </Badge>
          <Badge className="bg-primary-fixed text-on-primary-fixed border-none px-3.5 py-1 rounded-full label-upper">
            Artisanal
          </Badge>
        </div>

        {/* Title */}
        <h1 className="headline-xl font-serif text-on-surface mb-3">
          {product.name}
        </h1>

        {/* Price & Rating */}
        <div className="flex items-center gap-4">
          <p className="text-primary text-3xl font-bold font-sans">
            ₱{product.price.toFixed(2)}
          </p>
          <div className="flex items-center text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-primary text-primary" />
            ))}
            <span className="ml-2 text-on-surface-variant text-xs font-semibold">
              (124 Reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="h-px bg-outline-variant/40 w-full"></div>

      {/* Description */}
      <p className="body-md text-on-surface-variant leading-relaxed">
        {product.description}
      </p>

      {/* Quantity & Actions */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-4">
          <span className="label-upper text-on-surface-variant">Quantity:</span>
          <div className="flex items-center border border-outline-variant/40 rounded-full overflow-hidden h-12 bg-surface-container-lowest shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || !inStock}
              className="px-4 hover:bg-surface-container-high transition-colors text-primary border-r border-outline-variant/30 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="text"
              readOnly
              value={quantity}
              className="w-12 text-center border-none bg-transparent focus:ring-0 text-base font-bold text-on-surface"
            />
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock || !inStock}
              className="px-4 hover:bg-surface-container-high transition-colors text-primary border-l border-outline-variant/30 disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            disabled={!inStock || loading}
            onClick={handleAddToCart}
            className="flex-1 bg-primary text-on-primary font-semibold py-4 rounded-full hover:bg-primary-container shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {loading ? "Adding..." : inStock ? `Add ${quantity} to Cart` : "Out of Stock"}
          </button>

          <button
            onClick={() => setWishlisted(!wishlisted)}
            className="flex-1 bg-surface-container-lowest border border-outline-variant/40 text-primary font-semibold py-4 rounded-full hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <Heart className={`w-5 h-5 ${wishlisted ? "fill-primary" : ""}`} />
            {wishlisted ? "Wishlisted" : "Wishlist"}
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex items-center gap-3 shadow-2xs">
          <Truck className="w-7 h-7 text-secondary shrink-0" />
          <div>
            <p className="text-xs font-bold text-on-surface">Fast Delivery</p>
            <p className="text-[11px] text-on-surface-variant">Metro Manila 24h</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low flex items-center gap-3 shadow-2xs">
          <Leaf className="w-7 h-7 text-secondary shrink-0" />
          <div>
            <p className="text-xs font-bold text-on-surface">Organic</p>
            <p className="text-[11px] text-on-surface-variant">No Preservatives</p>
          </div>
        </div>
      </div>

      {/* Accordions */}
      <div className="pt-6 space-y-3">
        <div className="border-b border-outline-variant/40 pb-4">
          <button
            onClick={() => setOpenHeritage(!openHeritage)}
            className="w-full flex justify-between items-center text-left font-bold text-on-surface text-sm cursor-pointer"
          >
            <span>Product Heritage</span>
            {openHeritage ? <ChevronUp className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-on-surface-variant" />}
          </button>
          {openHeritage && (
            <div className="pt-3 body-md text-on-surface-variant leading-relaxed animate-fade-in">
              Our recipe dates back to 1952, passed down through the Raphael family. We use a proprietary slow-churning process that takes over 4 hours for every batch to ensure the signature consistency.
            </div>
          )}
        </div>

        <div className="border-b border-outline-variant/40 pb-4 pt-1">
          <button
            onClick={() => setOpenIngredients(!openIngredients)}
            className="w-full flex justify-between items-center text-left font-bold text-on-surface text-sm cursor-pointer"
          >
            <span>Ingredients &amp; Nutritional Info</span>
            {openIngredients ? <ChevronUp className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-on-surface-variant" />}
          </button>
          {openIngredients && (
            <div className="pt-3 body-md text-on-surface-variant leading-relaxed animate-fade-in">
              Fresh Purple Yam, Condensed Milk, Evaporated Milk, Butter, Cane Sugar, and a touch of Vanilla. All-natural, gluten-free, and contains dairy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
