"use client";

import Link from "next/link";
import { useProduct } from "@/hooks/useProduct";
import { ProductImageGallery } from "./ProductImageGallery";
import { ProductDetailInfo } from "./ProductDetailInfo";
import { RelatedProducts } from "./RelatedProducts";
import { ProductReviewsSection } from "./ProductReviewsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, ArrowLeft, Loader2 } from "lucide-react";

interface ProductDetailPageProps {
  id: string;
}

export function ProductDetailPage({ id }: ProductDetailPageProps) {
  const { product, loading, error } = useProduct(id);

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <div className="p-3.5 rounded-full bg-secondary-container/50 text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <p className="label-upper text-primary animate-pulse">
            Loading Details...
          </p>
        </div>

        <Skeleton className="h-10 w-40 rounded-full bg-surface-container" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <Skeleton className="lg:col-span-7 w-full aspect-[4/3] rounded-3xl bg-surface-container" />
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-6 w-24 rounded-full bg-surface-container" />
            <Skeleton className="h-10 w-3/4 rounded-2xl bg-surface-container" />
            <Skeleton className="h-8 w-1/3 rounded-xl bg-surface-container" />
            <Skeleton className="h-24 w-full rounded-2xl bg-surface-container" />
            <Skeleton className="h-12 w-48 rounded-full bg-surface-container" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="max-w-[1440px] mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="headline-xl font-serif text-on-surface">Product Not Found</h2>
        <p className="mt-2 body-md text-on-surface-variant max-w-md">
          {error || "The requested product could not be located."}
        </p>
        <Button asChild className="mt-6 bg-primary text-on-primary hover:bg-primary-container font-semibold rounded-full px-8">
          <Link href="/products">&larr; Return to Shop</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 space-y-12 bg-surface">
      {/* Navigation Header: Back Button & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-sans">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-container transition-all bg-surface-container-lowest hover:bg-surface-container-high px-5 py-2.5 rounded-full border border-outline-variant/30 shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 label-upper text-on-surface-variant">
          <Link href="/products" className="hover:text-primary transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-primary transition-colors cursor-pointer">{product.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-outline" />
          <span className="text-on-surface font-bold">{product.name}</span>
        </nav>
      </div>

      {/* Main Grid Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <ProductImageGallery images={product.images} name={product.name} />
        <ProductDetailInfo product={product} />
      </section>

      {/* Related Products Section */}
      <RelatedProducts category={product.category} currentProductId={product.id} />

      {/* Customer Reviews & Ratings Section */}
      <ProductReviewsSection productId={product.id} />
    </main>
  );
}
