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
  sidebarEntries,
  settingsNavItem,
  settingsChildren,
  type SidebarEntry,
} from "./sidebar-nav";
import { SidebarProfileFooter } from "./sidebar-profile-footer";
import { SidebarNavSkeleton } from "./sidebar-nav-skeleton";
import { SidebarEnterpriseHeader } from "./sidebar-enterprise-header";

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

  const SettingsIcon = settingsNavItem.icon;

  const showSettings = !!session?.isSuperUser;

  const navGroupToModule: Record<string, string> = {
    Contacts: "Customer Profiles",
    Conversations: "Conversations",
  };

  const crmsPerms = session?.permissions?.CRMS as Record<string, Record<string, boolean>> | undefined;
  const isSuperUser = !!session?.isSuperUser;

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
        <SidebarEnterpriseHeader isMobile={isMobile} />

        <SidebarContent className="p-md overflow-y-auto">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              {isNavLoading ? (
                <SidebarNavSkeleton />
              ) : (
                <div className="space-y-xs">
                  {sidebarEntries.map((entry) => {
                    if (entry.kind === "item") {
                      const item = entry.item;
                      const ItemIcon = item.icon;
                      const isActive =
                        item.href === "/dashboard"
                          ? pathname === "/dashboard" || pathname === "/"
                          : pathname === item.href || pathname.startsWith(item.href + "/");

                      return (
                        <SidebarMenu key={item.name}>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className="w-full flex items-center gap-sm px-sm py-sm rounded-lg text-sm text-foreground transition-colors"
                            >
                              <Link href={item.href} onClick={handleNavClick}>
                                <ItemIcon className="w-4 h-4 shrink-0" />
                                <span>{item.name}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      );
                    }

                    const group = entry.group;
                    const moduleName = navGroupToModule[group.name];
                    if (!isSuperUser && moduleName && crmsPerms?.[moduleName]?.canRead !== true) {
                      return null;
                    }

                    const GroupIcon = group.icon;
                    const hasActiveChild = group.children.some(
                      (child) =>
                        pathname === child.href ||
                        pathname.startsWith(child.href + "/")
                    );
                    const isExpanded = expandedGroups[group.name] ?? hasActiveChild;

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
                                  (child.href !== "/contacts" &&
                                    pathname.startsWith(child.href + "/"));
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
                </div>
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
