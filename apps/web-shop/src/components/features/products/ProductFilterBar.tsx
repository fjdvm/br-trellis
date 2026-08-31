"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { ProductCategory, type ProductQueryParams } from "@/types/product";

interface ProductFilterBarProps {
  params: ProductQueryParams;
  onChange: (newParams: ProductQueryParams) => void;
}

export function ProductFilterBar({ params, onChange }: ProductFilterBarProps) {
  const categories = ["All", ...Object.values(ProductCategory)];

  const handleCategoryClick = (cat: string) => {
    onChange({
      ...params,
      category: cat === "All" ? undefined : (cat as ProductCategory),
      page: 1,
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...params,
      search: e.target.value || undefined,
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    onChange({
      ...params,
      sort: value === "featured" ? undefined : value,
      page: 1,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30 shadow-2xs">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none font-sans">
        {categories.map((cat) => {
          const isActive = cat === "All" ? !params.category : params.category === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high hover:text-primary border border-outline-variant/30"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex items-center gap-3 font-sans">
        <div className="relative flex-1 md:w-64">
          <Input
            type="text"
            placeholder="Search catalog..."
            value={params.search || ""}
            onChange={handleSearchChange}
            className="pl-9 text-xs rounded-full border-outline-variant/40 bg-surface-container-lowest text-on-surface focus-visible:ring-primary h-10"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        </div>

        <Select value={params.sort || "featured"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px] text-xs rounded-full border-outline-variant/40 bg-surface-container-lowest text-on-surface h-10">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-outline-variant/40 bg-surface-container-lowest">
            <SelectItem value="featured">Sort: Featured</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="name_asc">Name: A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
