import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Ticket,
  Megaphone,
  Settings,
  Building2,
  ShoppingCart,
  Users2,
  CreditCard,
  Truck,
  Package,
  Zap,
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

export interface AccountItem {
  id: string;
  name: string;
  role: string;
  email: string;
}

export type Account = AccountItem;

export const mainNavItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Contacts", href: "/contacts", icon: Users },
];

export const settingsNavItem: NavItem = {
  name: "Settings",
  href: "/settings",
  icon: Settings,
};

export const navItems: NavItem[] = [...mainNavItems];

export interface NavGroup {
  name: string;
  icon: LucideIcon;
  children: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    name: "Ecommerce",
    icon: ShoppingCart,
    children: [
      { name: "Orders", href: "/ecommerce/orders", icon: CreditCard },
      { name: "Products", href: "/ecommerce/products", icon: Package },
      { name: "Abandoned Carts", href: "/ecommerce/abandoned-carts", icon: ShoppingCart },
      { name: "Customer LTV", href: "/ecommerce/ltv", icon: Users2 },
    ],
  },
  {
    name: "Automation",
    icon: Zap,
    children: [
      { name: "Workflows", href: "/automation/workflows", icon: Zap },
    ],
  },
];

export const systems: SystemItem[] = [
  {
    fullName: "Customer Relationship Management",
    desc: "Contact profiles, tickets & marketing",
    icon: Building2,
    active: true,
  },
  {
    fullName: "E-Commerce Storefront",
    desc: "Online orders & products",
    icon: ShoppingCart,
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

export const accounts: AccountItem[] = [
  {
    id: "admin",
    name: "Bren Raphael",
    role: "Administrator",
    email: "bren@sentracx.com",
  },
  {
    id: "support",
    name: "Support Lead Account",
    role: "Support Manager",
    email: "support.lead@sentracx.com",
  },
  {
    id: "sales",
    name: "Sales Ops Account",
    role: "Sales Lead",
    email: "sales.ops@sentracx.com",
  },
];
