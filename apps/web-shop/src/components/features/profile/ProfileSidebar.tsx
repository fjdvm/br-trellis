"use client";

import { User, MapPin, History, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { TabType } from "@/hooks/useProfilePage";
import type { UserDto } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileSidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: UserDto | null;
}

export function ProfileSidebar({ activeTab, onTabChange, user }: ProfileSidebarProps) {
  const tabs = [
    { id: "personal" as TabType, label: "Personal Info", icon: User },
    { id: "addresses" as TabType, label: "Saved Addresses", icon: MapPin },
    { id: "orders" as TabType, label: "Order History", icon: History },
  ];

  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="w-full">
      <nav className="flex flex-col gap-1 bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs">
        {/* User Summary Block */}
        <div className="flex flex-col items-center text-center pb-5 mb-4 border-b border-outline-variant/20">
          <Avatar className="w-16 h-16 border-2 border-primary/20 text-xl font-serif font-bold bg-primary-container/20 text-primary mb-3">
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <h3 className="font-serif font-bold text-base text-on-surface leading-tight">
            {user?.fullName || "Valued Customer"}
          </h3>
          <p className="font-sans text-xs text-on-surface-variant mt-1 break-all">
            {user?.email}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="space-y-1.5 font-sans">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sign Out Section */}
        <div className="pt-4 mt-4 border-t border-outline-variant/20 w-full font-sans">
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold text-error hover:bg-error-container/30 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
