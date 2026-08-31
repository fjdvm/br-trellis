"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "./ProductCard";
import { ArrowRight } from "lucide-react";
import type { ProductCategory } from "@/types/product";

interface RelatedProductsProps {
  category: ProductCategory;
  currentProductId: string;
}

export function RelatedProducts({ category, currentProductId }: RelatedProductsProps) {
  const { products, loading } = useProducts({ category, pageSize: 5 });

  const related = products.filter((p) => p.id !== currentProductId).slice(0, 4);

  if (!loading && related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-outline-variant/30 font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="label-upper text-secondary block mb-1">Pairings</span>
          <h2 className="headline-xl font-serif text-on-surface">
            You May Also Love
          </h2>
          <p className="body-md text-on-surface-variant">
            Perfect pairings for your Ube experience.
          </p>
        </div>
        <Link
          href="/products"
          className="text-primary label-upper flex items-center gap-1 hover:text-primary-container font-bold transition-colors"
        >
          View Shop
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {related.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
}
