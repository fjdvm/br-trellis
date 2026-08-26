"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Check, ChevronRight, X } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  dashboardItem,
  navGroups,
  settingsNavItem,
  settingsChildren,
  systems,
} from "./SidebarNav";
import { SidebarProfileFooter } from "./SidebarProfileFooter";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open, openMobile, setOpenMobile, toggleSidebar, isMobile } =
    useSidebar();
  const [activeAccount, setActiveAccountState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeAccount") || "admin";
    }
    return "admin";
  });
  const [mounted, setMounted] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  React.useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("activeAccount") === null) {
      localStorage.setItem("activeAccount", "admin");
    }
  }, []);

  const setActiveAccount = (id: string) => {
    setActiveAccountState(id);
    localStorage.setItem("activeAccount", id);
    window.dispatchEvent(new Event("storage"));
  };

  const isOpen = isMobile ? openMobile : open;

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (mounted && !isOpen) {
    return null;
  }

  const DashboardIcon = dashboardItem.icon;
  const isDashboardActive =
    pathname === dashboardItem.href || pathname === "/";

  const SettingsIcon = settingsNavItem.icon;
  const isSettingsActive = pathname.startsWith("/settings");

  const showSettings = !!session?.isSuperUser;

  return (
    <>
      {isMobile && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] animate-in fade-in duration-200"
        />
      )}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground z-[60] transition-all duration-300 shadow-xl md:shadow-none animate-in slide-in-from-left duration-300">
        <SidebarHeader className="p-md border-b border-border/50">
          <div className="flex items-center justify-between gap-xs">
            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between p-sm rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors group">
                    <div className="flex flex-col min-w-0 pr-sm">
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-sidebar-foreground truncate">
                        Bren Raphael&apos;s
                      </h1>
                      <button className="text-xs font-semibold bg-violet-500 text-white px-sm py-xs rounded truncate mt-0.5">
                        Customer Relationship Mgmt.
                      </button>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-sidebar-foreground transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 bg-popover border-border text-popover-foreground z-[99999]"
                  align="start"
                  side="bottom"
                >
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">
                    Select Enterprise Module
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  {systems.map((sys) => {
                    const SysIcon = sys.icon;
                    return (
                      <DropdownMenuItem
                        key={sys.fullName}
                        className="cursor-pointer text-xs flex items-center justify-between py-sm.5 px-sm hover:bg-accent font-medium"
                      >
                        <div className="flex items-center gap-sm.5 overflow-hidden">
                          <SysIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span
                              className={`font-semibold truncate ${sys.active ? "text-foreground font-bold" : ""}`}
                            >
                              {sys.fullName}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {sys.desc}
                            </span>
                          </div>
                        </div>
                        {sys.active && (
                          <Check className="w-4 h-4 text-primary shrink-0 ml-sm" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isMobile && (
              <SidebarTrigger
                className="text-muted-foreground hover:text-sidebar-foreground h-8 w-8 rounded-lg shrink-0 cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </SidebarTrigger>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="p-md overflow-y-auto">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              {/* Dashboard (standalone, no sub-tabs) */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isDashboardActive}
                    className="w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm transition-colors"
                  >
                    <Link href={dashboardItem.href} onClick={handleNavClick}>
                      <DashboardIcon className="w-4 h-4 shrink-0" />
                      <span>{dashboardItem.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              {/* All nav groups */}
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveChild = group.children.some(
                  (child) =>
                    pathname === child.href ||
                    pathname.startsWith(child.href + "/")
                );
                const isExpanded =
                  expandedGroups[group.name] ?? hasActiveChild;

                return (
                  <div key={group.name} className="mt-xs">
                    <button
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [group.name]: !isExpanded,
                        }))
                      }
                      className={`w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm transition-colors hover:bg-sidebar-accent ${
                        hasActiveChild
                          ? "text-sidebar-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      <GroupIcon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{group.name}</span>
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-[18px] mt-xs border-l-2 border-border pl-md">
                        <SidebarMenu>
                          {group.children.map((child) => {
                            const isChildActive =
                              pathname === child.href ||
                              pathname.startsWith(child.href + "/");
                            return (
                              <SidebarMenuItem key={child.name}>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isChildActive}
                                  className="w-full flex items-center gap-sm px-sm py-xs rounded-lg text-sm transition-colors"
                                >
                                  <Link
                                    href={child.href}
                                    onClick={handleNavClick}
                                  >
                                    <span>{child.name}</span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </div>
                    )}
                  </div>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-sm border-t border-border space-y-2">
          {showSettings && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm transition-colors hover:bg-sidebar-accent ${
                    isSettingsActive
                      ? "text-sidebar-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">Settings</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-popover border-border text-popover-foreground z-[99999] shadow-xl p-sm"
                side="top"
                align="start"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-sm">
                  Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                {settingsChildren.map((child) => {
                  const ChildIcon = child.icon;
                  return (
                    <DropdownMenuItem key={child.name} asChild className="cursor-pointer text-xs font-medium gap-sm p-sm hover:bg-accent">
                      <Link href={child.href} onClick={handleNavClick}>
                        <ChildIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{child.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="pt-sm border-t border-border">
            <SidebarProfileFooter
              activeAccount={activeAccount}
              onSelectAccount={setActiveAccount}
            />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </aside>
    </>
  );
}
