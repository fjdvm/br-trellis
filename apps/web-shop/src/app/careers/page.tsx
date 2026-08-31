import type { Metadata } from "next";
import { CareersHeader } from "@/components/features/careers/CareersHeader";
import { CareersList } from "@/components/features/careers/CareersList";

export const metadata: Metadata = {
  title: "Careers | Bren Raphael's Ube Jam & Halaya Shop",
  description: "Join Bren Raphael's team in redefining quality desserts. Explore our open positions and apply today.",
};

export default function CareersPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <CareersHeader />
      <CareersList />
    </div>
  );
}
