"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

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

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80";

export function BentoProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const primaryImage = product.images?.[0] || DEFAULT_IMAGE;
  const categoryLabel = CATEGORY_NAMES[product.category] || "Artisanal";
  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product.id, 1, {
      name: product.name,
      price: product.price,
      image: primaryImage,
      sku: product.sku,
      stock: product.stock,
    });
  };

  return (
    <article className="group flex flex-col relative bg-surface-container-low p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 hover:bg-surface-container">
      {/* Image Area */}
      <Link
        href={`/products/${product.id}`}
        className="relative w-full aspect-[4/5] mb-6 overflow-hidden bg-surface flex items-center justify-center"
      >
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          unoptimized={primaryImage.startsWith("http")}
          className="object-contain w-3/4 h-3/4 transition-transform duration-700 group-hover:scale-105"
        />

        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="px-4 py-1.5 text-xs uppercase font-bold tracking-widest rounded-full bg-surface text-on-surface">
              Out of Stock
            </span>
          </div>
        )}

        {/* Desktop Quick Add Glassmorphism Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
            disabled={!inStock}
            className="w-full py-3 bg-surface/80 backdrop-blur-md border border-white/20 text-primary font-sans text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors shadow-xs disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </Link>

      {/* Text Info */}
      <div className="flex flex-col flex-grow">
        <p className="label-upper text-on-surface-variant mb-1">{categoryLabel}</p>
        <Link href={`/products/${product.id}`}>
          <h3 className="font-serif font-bold text-xl text-primary mb-2 line-clamp-1 hover:underline">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-center justify-between">
          <p className="body-lg font-bold text-on-surface">₱{product.price.toFixed(2)}</p>
          <div className="flex items-center text-amber-500 text-xs gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-500 stroke-amber-500" />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Add to Cart Button (Always Visible) */}
      <div className="block md:hidden mt-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock}
          className="w-full py-3 bg-primary text-white font-sans text-sm font-semibold rounded-full flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-transform disabled:opacity-50"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export function HomeSignatureCollection() {
  const { products, loading, error } = useProducts({ page: 1, pageSize: 4 });

  return (
    <section className="py-[120px] bg-surface" id="shop">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[64px]">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div>
            <h2 className="headline-xl font-serif text-primary mb-3">Curated Essentials</h2>
            <p className="body-md text-on-surface-variant max-w-md">
              Our signature formulations, designed to bring the rich heritage and subtle sweetness of Ube to your daily rituals.
            </p>
          </div>
          {/* Navigation Arrows (Cosmetic) */}
          <div className="flex gap-4">
            <button
              aria-label="Previous slide"
              className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Next slide"
              className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors shadow-xs hover:scale-105 duration-300"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
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

        {/* View All Products Button */}
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center border border-primary text-primary px-8 py-3 font-sans text-sm font-semibold hover:bg-primary hover:text-white transition-colors duration-300"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
