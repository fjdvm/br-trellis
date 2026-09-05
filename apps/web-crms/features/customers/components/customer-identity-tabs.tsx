import Link from "next/link";
import { cn } from "@/lib/utils";

interface CustomerIdentityTabsProps {
  active: "customers" | "pending-review";
}

const tabs = [
  { id: "customers", label: "Customers", href: "/customers/at-risk" },
  { id: "pending-review", label: "Pending Review", href: "/customers/pending-review" },
] as const;

export function CustomerIdentityTabs({ active }: CustomerIdentityTabsProps) {
  return (
    <div aria-label="Customer views" className="border-b border-border" role="tablist">
      <div className="flex gap-lg">
        {tabs.map((tab) => (
          <Link
            aria-current={active === tab.id ? "page" : undefined}
            className={cn(
              "border-b-2 px-sm py-sm text-sm font-medium text-muted-foreground",
              active === tab.id && "border-primary text-foreground"
            )}
            href={tab.href}
            key={tab.id}
            role="tab"
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
