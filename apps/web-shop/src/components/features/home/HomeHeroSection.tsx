import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeHeroSection() {
  return (
    <section className="relative w-full h-[819px] min-h-[600px] flex items-center justify-center overflow-hidden bg-surface-container-low border-b border-outline-variant/30">
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTYYfgRS8gG_CxCZ40q_H__Ckh68X6a-aTJQ1cuxEEeiIRxCx-RKHWGJ3GPpXLUCjzgzHAG-K-zjnU17EywoLQXG89j_unVbIhh8hMTNNp-M2CDjxK2bZe-qKCqn_CM048dZ6EKUwCH_DKVsr18FMa1rF9KwEXC36UJCxj3SThyJ0N9gAeVDORZTx_j-d0vxHasCq1F59l-siHoWmpyJOJDM2_6QIiCbJAnHSklK9MM_un2iZvHQxr"
          alt="Artisanal Ube Slices & Delicacies"
          fill
          priority
          unoptimized
          className="object-cover w-full h-full opacity-90 transition-transform duration-[10s] hover:scale-105 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/70 via-surface/30 to-surface/20" />
      </div>

      <div className="relative z-10 text-center px-5 md:px-[64px] max-w-4xl mx-auto flex flex-col items-center gap-6 mt-20 font-sans">
        <h1 className="display-lg text-primary tracking-tight leading-tight font-serif drop-shadow-xs">
          <span className="hidden md:inline">
            Nature&apos;s purple elegance,<br />crafted for you.
          </span>
          <span className="inline md:hidden">
            The Essence of Ube.
          </span>
        </h1>

        <p className="body-lg text-on-surface-variant max-w-2xl text-balance leading-relaxed">
          Discover our curated collection of artisanal ube delicacies, blending traditional roots with modern culinary sophistication.
        </p>

        <Link
          href="/products"
          className="mt-8 px-8 py-4 bg-primary text-on-primary rounded-full font-sans text-sm font-semibold uppercase tracking-widest hover:bg-primary/90 hover:scale-[1.02] transition-all duration-300 shadow-md inline-flex items-center gap-2"
        >
          Explore Collection
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
