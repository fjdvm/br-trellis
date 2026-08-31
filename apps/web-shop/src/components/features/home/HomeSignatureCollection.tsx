"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export interface BentoProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  formattedPrice: string;
  image: string;
  badge?: {
    text: string;
    variant: "primary" | "secondary";
  };
  rating?: number;
}

export const UBE_PRODUCTS: BentoProduct[] = [
  {
    id: "ube-cream",
    name: "Ube Cream",
    category: "Signature Spread",
    price: 24,
    formattedPrice: "$24.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDPJvudR-coJQnmXn0SG18CIXNB-geEbE3ML_K2e4pWAZxNR1HVPPHvwv-kWegsvycGiDm5Ho4OxW8voPvRdfa_gXF9rqPZzo8O3VIiJJ9pCOreYZEJ6xIz0eFq8ucte45mDeoNtipXfMjX-FVajoJIn5eqi9PGiynrvl5RspVeLccOTq9M0m1iWXih0sA-TlwoOm5eFTFHR2JE8AspBqp7WxWNuopCb5XK8SRldm0kA0aLU67_1PRR",
    badge: { text: "Bestseller", variant: "secondary" },
    rating: 4.5,
  },
  {
    id: "purple-yam-jam",
    name: "Purple Yam Jam",
    category: "Preserves",
    price: 18,
    formattedPrice: "$18.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDCK2_zvxOS8VCDQW2lb3TFCUCR7o0GIBwh8yS2xRRgXTObJM-apHisKbhmHNJf5UrKLppyh1u6CalRCqE0eT_rk342EoDPs4N6qhBICw0hiiSZUvCHxxJUA0J3UBJg8o4qYNWi2cViUfGRc-KyvqZPtS7RB_zkn6vvJLNYmkSmPMikMBYkbII502nIkMk7qThGW2LAvcdn72FE9-yNaMNvlOwcQqDWHcDbJ9SUNoQGYg2msEmBiB_K",
  },
  {
    id: "artisanal-ube-cake",
    name: "Artisanal Ube Cake",
    category: "Bakery",
    price: 45,
    formattedPrice: "$45.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB8dVsNjfWWVxdoTRjlc-DOFYwkKOOX7fDVZ8HFFecc9S1u3Ct1iPp-zrpb6mGPDwTXALlL1e3EGT8HT_3kLhfQWnYPq3xMjlckQXGxcJ16k-VNztmRSHVIq0ErC89E2ZSltVPjvm824AlgHI8mpGwZ_tSMDuYO9fXCIlLtJalqjiP3Lpa-PnYv1S_tM0Y9_eHFfQ6JwOFraKD76yzjVisMPkcDewrhj7rj_Cf0jbcemN-O_bXIxEFk",
    badge: { text: "New", variant: "primary" },
  },
  {
    id: "ube-extract",
    name: "Ube Extract",
    category: "Essentials",
    price: 32,
    formattedPrice: "$32.00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC07hmWOl5y_trOgbx-WOMR4jE0zUBRYFZT3lOmeTa1gAvPwDNx0wMfSl907bdzH_Y7T-QaDCcHiTs-Yl1ni2shw5TAUc921nu-KeFG49S9-5VA3wFjobGFvyHN8iBcHiIt4GFVJp30_EPIf_VIcLM_gRrPhErEKfW5dNqlra55sj7aIBbw_yuQ8Wjumoy-dr30zSY53ob-duZs0Vxp4WYgkJHqSBnATNhPIRWwq6dLFaAJqdLx9omF",
    rating: 5,
  },
];

export function BentoProductCard({ product }: { product: BentoProduct }) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product.id);
  };

  return (
    <article className="group flex flex-col relative bg-surface-container-low rounded-xl p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 hover:bg-surface-container">
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-6 left-6 z-10">
          <span
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full shadow-xs ${
              product.badge.variant === "primary"
                ? "bg-primary text-on-primary"
                : "bg-secondary-fixed text-on-secondary-fixed"
            }`}
          >
            {product.badge.text}
          </span>
        </div>
      )}

      {/* Image Area */}
      <div className="relative w-full aspect-[4/5] mb-6 overflow-hidden rounded-lg bg-surface flex items-center justify-center">
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized
          className="object-contain w-3/4 h-3/4 transition-transform duration-700 group-hover:scale-105"
        />

        {/* Desktop Quick Add Glassmorphism Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block">
          <button
            onClick={handleAddToCart}
            className="w-full py-3 bg-surface/80 backdrop-blur-md border border-white/20 text-primary font-sans text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Text Info */}
      <div className="flex flex-col flex-grow">
        <p className="label-upper text-on-surface-variant mb-1">{product.category}</p>
        <h3 className="font-serif font-bold text-xl text-primary mb-2 line-clamp-1">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between">
          <p className="body-lg font-bold text-on-surface">{product.formattedPrice}</p>
          {product.rating && (
            <div className="flex items-center text-amber-500 text-xs gap-0.5">
              {Array.from({ length: Math.floor(product.rating) }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-500 stroke-amber-500" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Add to Cart Button (Always Visible) */}
      <div className="block md:hidden mt-4">
        <button
          onClick={handleAddToCart}
          className="w-full py-3 bg-primary text-on-primary font-sans text-sm font-semibold rounded-full flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-transform"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export function HomeSignatureCollection() {
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
              className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-xs hover:scale-105 duration-300"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {UBE_PRODUCTS.map((product) => (
            <BentoProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Products Button */}
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center justify-center border border-primary text-primary px-8 py-3 rounded-full font-sans text-sm font-semibold hover:bg-primary hover:text-on-primary transition-colors duration-300"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
