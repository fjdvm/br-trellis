"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { FAQ_ITEMS, type FaqItem } from "@/lib/faq-data";

export function HomeFaqSection() {
  const [openId, setOpenId] = useState<string | null>("faq-1");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Products & Shelf Life", "Ordering & Delivery", "Returns & Support"];

  const filteredItems =
    selectedCategory === "All"
      ? FAQ_ITEMS.slice(0, 6)
      : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-[120px] bg-surface-container-low border-y border-outline-variant/30 overflow-hidden" id="faq">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[64px]">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="label-upper text-secondary block">Frequently Asked Questions</span>
          <h2 className="headline-xl font-serif text-primary">Everything You Need to Know</h2>
          <p className="body-md text-on-surface-variant leading-relaxed">
            Find answers regarding our artisanal ingredients, heirloom recipes, shelf life, and delivery options.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2.5 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-5 py-2.5 text-xs font-sans font-semibold transition-all shadow-2xs ${
                selectedCategory === cat
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {filteredItems.map((item: FaqItem) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest transition-all shadow-2xs hover:shadow-xs"
              >
                <button
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-center justify-between p-6 text-left font-serif font-bold text-lg text-primary hover:text-primary-container transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 shrink-0 text-primary" />
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-on-surface-variant transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-outline-variant/20 bg-surface-container-low/50 px-6 py-5 body-md text-on-surface-variant leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to full FAQ page */}
        <div className="mt-12 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-primary font-sans text-sm font-semibold hover:text-primary-container transition-colors group"
          >
            <span>View Full Help &amp; FAQ Center</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
