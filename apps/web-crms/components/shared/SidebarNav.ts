import {
  LayoutDashboard,
  Users,
  Building2,
  ListFilter,
  AlertTriangle,
  ShoppingCart,
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

export interface NavGroup {
  name: string;
  icon: LucideIcon;
  children: NavItem[];
}

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

// Dashboard is a standalone item (no sub-tabs)
export const dashboardItem: NavItem = {
  name: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
};

export const settingsNavItem: NavItem = {
  name: "Settings",
  href: "/settings",
  icon: Settings,
};

// Legacy exports for backward compatibility
export const mainNavItems: NavItem[] = [dashboardItem];
export const navItems: NavItem[] = [...mainNavItems];

// Full sidebar structure with all 9 sections
export const navGroups: NavGroup[] = [
  {
    name: "Contacts",
    icon: Users,
    children: [
      { name: "All Contacts", href: "/contacts", icon: Users },
      { name: "Companies", href: "/contacts/companies", icon: Building2 },
      { name: "Lists/Segments", href: "/contacts/segments", icon: ListFilter },
      { name: "At-Risk Customers", href: "/contacts/at-risk", icon: AlertTriangle },
    ],
  },
  {
    name: "Tickets",
    icon: Ticket,
    children: [
      { name: "Tickets", href: "/tickets", icon: Ticket },
      { name: "My Assigned", href: "/tickets/assigned", icon: UserCheck },
      { name: "History", href: "/tickets/history", icon: History },
    ],
  },
  {
    name: "Conversations",
    icon: MessageSquare,
    children: [
      { name: "Inbox", href: "/conversations/inbox", icon: Inbox },
      { name: "Canned Replies", href: "/conversations/canned-replies", icon: FileText },
    ],
  },
  {
    name: "Content",
    icon: Megaphone,
    children: [
      { name: "Calendar", href: "/content/calendar", icon: Calendar },
      { name: "Published Posts", href: "/content/published", icon: Send },
      { name: "Comment Sentiment", href: "/content/comments", icon: MessageCircle },
    ],
  },
  {
    name: "Reports",
    icon: BarChart3,
    children: [
      { name: "Custom Dashboards", href: "/reports/dashboards", icon: PieChart },
      { name: "Revenue Attribution", href: "/reports/revenue", icon: TrendingUp },
    ],
  },
];

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
