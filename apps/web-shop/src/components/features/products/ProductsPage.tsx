"use client";

import { UBE_PRODUCTS, BentoProductCard } from "@/components/features/home/HomeSignatureCollection";

export function ProductsPage() {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {UBE_PRODUCTS.map((product) => (
            <BentoProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
