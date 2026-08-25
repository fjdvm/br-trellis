import Link from "next/link";
import { cn } from "@/lib/utils";

interface ContactTabsProps {
  active: "contacts" | "pending-review";
}

const tabs = [
  { id: "contacts", label: "Contacts", href: "/contacts" },
  { id: "pending-review", label: "Pending Review", href: "/contacts/pending-review" },
] as const;

export function ContactTabs({ active }: ContactTabsProps) {
  return (
    <div aria-label="Contact views" className="border-b border-border" role="tablist">
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
