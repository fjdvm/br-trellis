import {
  LayoutDashboard,
  Users,
  Building2,
  ListFilter,
  AlertTriangle,
  ShoppingCart,
  ShoppingBag,
  Package,
  CreditCard,
  MessageSquare,
  Inbox,
  Ticket,
  UserCheck,
  History,
  FileText,
  Megaphone,
  Calendar,
  Send,
  MessageCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  Settings,
  Users2,
  Link2,
  Puzzle,
  Layers,
  Truck,
  LayoutGrid,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export type NavChild = NavItem;
export type SystemChild = SystemItem;

export interface NavGroup {
  title?: string;
  name: string;
  icon: LucideIcon;
  children: NavItem[];
}

export type SidebarEntry =
  | { kind: "item"; item: NavItem }
  | { kind: "group"; group: NavGroup };

export interface SystemItem {
  fullName: string;
  desc: string;
  icon: LucideIcon;
  active: boolean;
  url?: string;
}

export interface AccountItem {
  id: string;
  name: string;
  role: string;
  email: string;
}

export type Account = AccountItem;

// Standalone Items
export const dashboardItem: NavItem = {
  name: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
};

export const segmentsItem: NavItem = {
  name: "Segments",
  href: "/contacts/segments",
  icon: ListFilter,
};

export const ticketsNavItem: NavItem = {
  name: "Tickets",
  href: "/tickets",
  icon: Ticket,
};

export const campaignsNavItem: NavItem = {
  name: "Campaigns",
  href: "/campaigns",
  icon: Megaphone,
};

export const analyticsNavItem: NavItem = {
  name: "Analytics & Report",
  href: "/reports",
  icon: BarChart3,
};

export const settingsNavItem: NavItem = {
  name: "Settings",
  href: "/settings",
  icon: Settings,
};

// Top-level ordered sidebar entries
export const sidebarEntries: SidebarEntry[] = [
  {
    kind: "item",
    item: dashboardItem,
  },
  {
    kind: "group",
    group: {
      name: "Contacts",
      icon: Users,
      children: [
        { name: "All", href: "/contacts", icon: Users },
        { name: "Contacts", href: "/contacts/direct", icon: UserCheck },
        { name: "Ecommerce", href: "/contacts/ecommerce", icon: ShoppingCart },
        { name: "Orders", href: "/ecommerce/orders", icon: ShoppingBag },
        { name: "Products", href: "/ecommerce/products", icon: Package },
        { name: "Carts", href: "/ecommerce/abandoned-carts", icon: ShoppingCart },
        { name: "LTV", href: "/ecommerce/ltv", icon: TrendingUp },
        { name: "Companies", href: "/contacts/companies", icon: Building2 },
      ],
    },
  },
  {
    kind: "item",
    item: segmentsItem,
  },
  {
    kind: "item",
    item: ticketsNavItem,
  },
  {
    kind: "group",
    group: {
      name: "Conversations",
      icon: MessageSquare,
      children: [
        { name: "Inbox", href: "/conversations/inbox", icon: Inbox },
        { name: "Canned Replies", href: "/conversations/canned-replies", icon: FileText },
      ],
    },
  },
  {
    kind: "item",
    item: campaignsNavItem,
  },
  {
    kind: "item",
    item: analyticsNavItem,
  },
];

// Legacy exports for backward compatibility
export const mainNavItems: NavItem[] = [dashboardItem];
export const navItems: NavItem[] = [...mainNavItems];
export const navGroups: NavGroup[] = sidebarEntries
  .filter((e): e is { kind: "group"; group: NavGroup } => e.kind === "group")
  .map((e) => e.group);

// Settings sub-items (rendered separately in footer)
export const settingsChildren: NavItem[] = [
  { name: "Team & Permissions", href: "/settings/team", icon: Users2 },
  { name: "Ecommerce Sync", href: "/settings/ecommerce-sync", icon: Link2 },
  { name: "Integrations", href: "/settings/integrations", icon: Puzzle },
  { name: "Custom Properties", href: "/settings/custom-properties", icon: Layers },
];

export const systems: SystemItem[] = [
  {
    fullName: "Enterprise Portal",
    desc: "All systems hub & app launcher",
    icon: LayoutGrid,
    active: false,
    url: process.env.NEXT_PUBLIC_HOST_URL ?? "https://localhost:3000/",
  },
  {
    fullName: "Customer Relationship Management",
    desc: "Contact profiles, tickets & marketing",
    icon: Building2,
    active: true,
    url: process.env.NEXT_PUBLIC_CRMS_URL ?? "https://localhost:3005/",
  },
  {
    fullName: "Human Resource Management",
    desc: "Staff directory & payroll",
    icon: Users2,
    active: false,
    url: process.env.NEXT_PUBLIC_HRMS_URL ?? "https://localhost:3001/",
  },
  {
    fullName: "E-Commerce Storefront",
    desc: "Online orders & products",
    icon: ShoppingCart,
    active: false,
    url: process.env.NEXT_PUBLIC_OOS_URL ?? "https://localhost:3004/",
  },
  {
    fullName: "Point of Sale",
    desc: "Retail & register checkout",
    icon: CreditCard,
    active: false,
    url: process.env.NEXT_PUBLIC_POS_URL ?? "https://localhost:3002/",
  },
  {
    fullName: "Supply Chain Management",
    desc: "Inventory & logistics",
    icon: Truck,
    active: false,
    url: process.env.NEXT_PUBLIC_SCMS_URL ?? "https://localhost:3003/",
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
