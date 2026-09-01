"use client";

import { BentoProductCard } from "@/components/features/home/HomeSignatureCollection";
import { useProducts } from "@/hooks/useProducts";

export function ProductsPage() {
  const { products, loading, error } = useProducts({ page: 1, pageSize: 12 });

  return (
    <div className="min-h-screen bg-surface py-[120px] px-5 md:px-[64px]">
      <div className="max-w-[1440px] mx-auto space-y-16">
        {/* Header */}
        <header className="space-y-3">
          <span className="label-upper text-secondary block">
            Artisanal Selection
          </span>
          <h1 className="headline-xl font-serif text-primary">
            Curated Essentials
          </h1>
          <p className="body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Our signature formulations, designed to bring the rich heritage and subtle sweetness of Ube to your daily rituals.
          </p>
        </header>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-low p-6 animate-pulse h-[420px]"
              >
                <div className="w-full aspect-[4/5] bg-surface-container mb-6" />
                <div className="h-4 bg-surface-container w-1/3 mb-2" />
                <div className="h-6 bg-surface-container w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="body-md text-on-surface-variant text-center py-12">
            Unable to load products right now. Please try again later.
          </p>
        ) : products.length === 0 ? (
          <p className="body-md text-on-surface-variant text-center py-12">
            No products available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <BentoProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
