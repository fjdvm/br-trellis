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
import { SidebarNavSkeleton } from "./SidebarNavSkeleton";


export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
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

  // Map nav group names to their AppModule permission names in internal-auth-service.
  // SuperUsers bypass this filter entirely (they see everything).
  // Groups without a mapping are always shown (no permission check yet).
  const navGroupToModule: Record<string, string> = {
    Contacts: "Customer Profiles",
    Tickets: "Conversations",
    Conversations: "Conversations",
  };

  const crmsPerms = session?.permissions?.CRMS as Record<string, Record<string, boolean>> | undefined;
  const isSuperUser = !!session?.isSuperUser;

  const allowedNavGroups = navGroups.filter((group) => {
    if (isSuperUser) return true;
    const moduleName = navGroupToModule[group.name];
    if (!moduleName) return true; // No permission mapping → always visible
    return crmsPerms?.[moduleName]?.canRead === true;
  });

  // Dashboard is gated on the "Dashboard" module permission (unless superuser)
  const showDashboard = isSuperUser || crmsPerms?.["Dashboard"]?.canRead === true;

  // While the session/permissions are still resolving, the set of visible nav
  // tabs is unknown. Show a skeleton transition so the nav fades in cleanly
  // instead of popping/flickering item-by-item.
  const isNavLoading = !mounted || sessionStatus === "loading";

  return (
    <>
      {isMobile && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] animate-in fade-in duration-200"
        />
      )}
      <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground z-[60] transition-all duration-300 shadow-xl md:shadow-none animate-in slide-in-from-left duration-300">
        <SidebarHeader className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between p-2 rounded-xl hover:bg-sidebar-accent cursor-pointer transition-colors group gap-2 border border-transparent hover:border-border/40">
                    <div className="flex flex-col min-w-0 gap-1 pr-1">
                      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-sidebar-foreground truncate leading-none">
                        Bren Raphael&apos;s
                      </h1>
                      <span className="text-xs font-semibold bg-violet-500 text-white px-2.5 py-1 rounded-md truncate mt-0.5 w-fit shadow-xs inline-block">
                        Customer Relationship Mgmt.
                      </span>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-sidebar-foreground transition-colors" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-72 sm:w-80 bg-popover border border-border text-popover-foreground z-[99999] p-2 space-y-1 shadow-xl rounded-xl"
                  align="start"
                  side="bottom"
                  sideOffset={6}
                >
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider px-3 py-1.5">
                    Select Enterprise Module
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1 bg-border" />
                  {systems.map((sys) => {
                    const SysIcon = sys.icon;
                    return (
                      <DropdownMenuItem
                        key={sys.fullName}
                        onClick={() => {
                          if (sys.url) {
                            window.location.href = sys.url;
                          }
                        }}
                        className={`cursor-pointer text-xs flex items-center justify-between p-2.5 rounded-lg transition-all font-medium gap-3 ${
                          sys.active
                            ? "bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                              sys.active
                                ? "bg-violet-600 text-white shadow-xs"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <SysIcon className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="flex flex-col min-w-0 overflow-hidden flex-1 justify-center gap-0.5">
                            <span
                              className={`font-semibold text-xs truncate leading-snug ${
                                sys.active ? "text-foreground font-bold" : "text-foreground"
                              }`}
                            >
                              {sys.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate leading-tight">
                              {sys.desc}
                            </span>
                          </div>
                        </div>
                        {sys.active && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
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
              {isNavLoading ? (
                <SidebarNavSkeleton />
              ) : (
                <>
              {/* Dashboard (standalone, no sub-tabs) */}
              {showDashboard && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isDashboardActive}
                    className="w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm text-foreground transition-colors"
                  >
                    <Link href={dashboardItem.href} onClick={handleNavClick}>
                      <DashboardIcon className="w-4 h-4 shrink-0" />
                      <span>{dashboardItem.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              )}

              {/* All nav groups (filtered by permissions) */}
              {allowedNavGroups.map((group) => {
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
                      onClick={() => {
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [group.name]: !isExpanded,
                        }));
                      }}
                      className="w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm transition-colors text-foreground hover:bg-sidebar-accent"
                    >
                      <GroupIcon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{group.name}</span>
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
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
                                  className="w-full flex items-center gap-sm px-sm py-xs rounded-lg text-sm text-foreground transition-colors"
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
                </>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-sm border-t border-border space-y-2">
          {showSettings && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm text-foreground transition-colors hover:bg-sidebar-accent"
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

          <div className={showSettings ? "pt-sm border-t border-border" : ""}>
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
