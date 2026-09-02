"use client";

import { HomeHeroSection } from "./HomeHeroSection";
import { HomeSignatureCollection } from "./HomeSignatureCollection";
import { HomeFaqSection } from "./HomeFaqSection";
import { MarketingContent } from "./MarketingContent";

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <MarketingContent />
      <HomeHeroSection />
      <HomeSignatureCollection />
      <HomeFaqSection />
    </div>
  );
}
