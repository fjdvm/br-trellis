"use client";

import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="space-y-8 py-4">
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <div className="p-3.5 bg-secondary-container/50 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <p className="label-upper text-primary animate-pulse">
            Fetching Catalog...
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4 p-4 border border-outline-variant/30 bg-surface-container-lowest">
              <Skeleton className="w-full aspect-square bg-surface-container" />
              <Skeleton className="h-5 w-3/4 bg-surface-container" />
              <Skeleton className="h-4 w-full bg-surface-container" />
              <Skeleton className="h-6 w-1/3 bg-surface-container" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-surface-container-low border border-dashed border-outline-variant text-on-surface">
        <div className="mx-auto w-12 h-12 bg-surface-container flex items-center justify-center mb-4 text-on-surface-variant">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="font-serif font-bold text-xl text-on-surface">No products found</h3>
        <p className="mt-2 body-md text-on-surface-variant max-w-sm mx-auto">
          Try adjusting your search query or category filters to discover available items.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
