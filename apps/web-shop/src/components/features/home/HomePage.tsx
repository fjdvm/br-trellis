"use client";

import { HomeHeroSection } from "./HomeHeroSection";
import { HomeSignatureCollection } from "./HomeSignatureCollection";
import { HomeFaqSection } from "./HomeFaqSection";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <HomeHeroSection />
      <HomeSignatureCollection />
      <HomeFaqSection />
    </div>
  );
}
