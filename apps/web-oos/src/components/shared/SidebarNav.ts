import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  ClipboardList,
  Settings,
  Building2,
  Users2,
  CreditCard,
  Users,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface SystemItem {
  fullName: string;
  desc: string;
  icon: LucideIcon;
  active: boolean;
}

export const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Fulfillment", href: "/fulfillment", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: ClipboardList },
];

export const settingsNavItem: NavItem = {
  name: "Settings",
  href: "/settings",
  icon: Settings,
};

export const navItems: NavItem[] = [...mainNavItems, settingsNavItem];

export const systems: SystemItem[] = [
  {
    fullName: "Order & Operations System",
    desc: "Orders, fulfillment & inventory",
    icon: ShoppingCart,
    active: true,
  },
  {
    fullName: "Customer Relationship Management",
    desc: "Customer profiles, tickets & marketing",
    icon: Building2,
    active: false,
  },
  {
    fullName: "Human Resource Management",
    desc: "Staff directory & payroll",
    icon: Users2,
    active: false,
  },
  {
    fullName: "Point of Sale",
    desc: "Retail & register checkout",
    icon: CreditCard,
    active: false,
  },
  {
    fullName: "Supply Chain Management",
    desc: "Inventory & logistics",
    icon: Truck,
    active: false,
  },
];
