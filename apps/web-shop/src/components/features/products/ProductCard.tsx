"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductCardProps {
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

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = product.images?.[0] || DEFAULT_IMAGE;
  const categoryLabel = CATEGORY_NAMES[product.category] || "Artisanal";

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <Card className="flex flex-col h-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 p-0">
        <div className="relative aspect-square bg-surface-container overflow-hidden rounded-t-2xl">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={primaryImage.startsWith("http")}
          />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <Badge className="bg-primary text-on-primary label-upper text-[10px] px-3 py-1 rounded-full border-none shadow-2xs">
              {categoryLabel}
            </Badge>
          </div>
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center z-20">
              <Badge variant="destructive" className="label-upper text-xs font-bold px-4 py-1.5 rounded-full">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5 flex flex-col flex-grow justify-between space-y-4">
          <div>
            <h3 className="font-serif font-bold text-xl text-on-surface mb-1 group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-sans font-bold text-primary text-xl">
              ₱{product.price.toFixed(2)}
            </span>
            <Button
              size="icon"
              className="bg-primary text-on-primary hover:bg-primary-container p-2.5 h-10 w-10 rounded-full transition-all active:scale-95 shadow-2xs"
              aria-label="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
