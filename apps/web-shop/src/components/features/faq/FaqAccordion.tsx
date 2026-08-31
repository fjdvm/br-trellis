"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ITEMS, type FaqItem } from "@/lib/faq-data";

export function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>("faq-1");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Ordering & Delivery", "Products & Shelf Life", "Account & Payments", "Returns & Support"];

  const filteredItems = selectedCategory === "All"
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-[#451077] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-[#451077]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3 max-w-3xl mx-auto">
        {filteredItems.map((item: FaqItem) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all shadow-xs"
            >
              <button
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between p-5 text-left font-semibold text-slate-900 hover:text-[#451077]"
              >
                <span className="flex items-center gap-3 text-sm">
                  <HelpCircle className="h-4 w-4 shrink-0 text-purple-600" />
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[#451077]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-xs leading-relaxed text-slate-600">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
