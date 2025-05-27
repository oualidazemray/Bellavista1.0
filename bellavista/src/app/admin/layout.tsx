"use client";

import React, { ReactNode, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
// Adjust the import path and component name to match your actual admin navbar/sidebar file
import AdminNavbarComponent, {
  ADMIN_NAV_ITEMS,
  AdminNavItemId,
} from "./NavbarAdmin";
import { useSession, signOut } from "next-auth/react";
import { Loader2, UserCircle, Menu, X, ShieldCheck } from "lucide-react"; // Added ShieldCheck for mobile consistency
import Link from "next/link"; // For mobile nav items if AdminNavbarItemRenderer isn't used

interface AdminLayoutProps {
  children: ReactNode;
}

// Helper component for rendering mobile nav items if AdminNavbar's NavItem is not directly reusable or needs different click handling
const MobileAdminNavItem: React.FC<{
  item: (typeof ADMIN_NAV_ITEMS)[number];
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-xl cursor-pointer group transition-colors duration-150
                        ${
                          isActive
                            ? "bg-purple-600/20 text-white"
                            : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                        }`}
      onClick={onClick}
    >
      <Icon
        size={20}
        className={`${
          isActive
            ? "text-purple-300"
            : "text-slate-400 group-hover:text-purple-300"
        }`}
      />
      <span className="text-sm font-medium">{item.label}</span>
    </div>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace(
        "/auth/login?error=AdminSessionRequired&callbackUrl=/admin/dashboard"
      );
    },
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  const determineActiveAdminItem = useCallback((): AdminNavItemId => {
    const segments = pathname.split("/").filter(Boolean);
    let currentSection: AdminNavItemId = ADMIN_NAV_ITEMS[0].id; // Default (e.g., 'dashboard')

    if (segments[0] === "admin") {
      if (segments.length === 1) {
        // Path is just /admin
        currentSection =
          ADMIN_NAV_ITEMS.find((item) => item.id === "dashboard")?.id ||
          ADMIN_NAV_ITEMS[0].id;
      } else if (segments.length >= 2) {
        const sectionId = segments[1] as AdminNavItemId;
        const matchedItem = ADMIN_NAV_ITEMS.find(
          (item) => item.id === sectionId
        );
        if (matchedItem) {
          currentSection = matchedItem.id;
        }
      }
    }
    return currentSection;
  }, [pathname]);

  const [activeAdminItem, setActiveAdminItem] = useState<AdminNavItemId>(
    determineActiveAdminItem()
  );

  useEffect(() => {
    setActiveAdminItem(determineActiveAdminItem());
  }, [pathname, determineActiveAdminItem]);

  const handleAdminNavItemSelect = async (itemId: AdminNavItemId) => {
    setIsMobileMenuOpen(false);
    if (itemId === "logout") {
      await signOut({ callbackUrl: "/auth/login" });
    } else {
      // Active item will be updated by useEffect listening to pathname
      const targetPath = ADMIN_NAV_ITEMS.find(
        (item) => item.id === itemId
      )?.path; // Assuming NAV_ITEMS have 'path'
      if (targetPath) {
        router.push(targetPath);
      } else {
        // Fallback if path isn't defined in ADMIN_NAV_ITEMS (e.g. for dynamic subroutes under a main item)
        router.push(`/admin/${itemId}`);
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-purple-300">
        <Loader2 className="w-12 h-12 animate-spin mr-3" />
        Loading Admin Session...
      </div>
    );
  }

  // This check is crucial. Middleware should be the primary guard.
  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    console.warn(
      "ADMIN_LAYOUT: Non-admin user accessed. Session role:",
      session?.user?.role
    );
    router.replace("/auth/login?error=AdminAccessDenied");
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-red-400">
        Access Denied. You do not have permission to view this page.
      </div>
    );
  }

  // Only proceed to render layout if authenticated as ADMIN
  if (status !== "authenticated" || session?.user?.role !== "ADMIN") {
    // This case should ideally be handled by `required: true` or middleware redirecting.
    // If somehow reached, show a generic loading or error.
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-purple-300">
        Authenticating...
      </div>
    );
  }

  const adminName = session.user.name || "Admin";
  const adminRoleDisplay = "Administrator"; // Since we've confirmed ADMIN role

  const mainContentMarginClass = isDesktopSidebarCollapsed
    ? "lg:ml-20"
    : "lg:ml-64"; // Based on w-20 and w-64 for sidebar

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminNavbarComponent
        activeItem={activeAdminItem}
        onSelectItem={handleAdminNavItemSelect}
        adminName={adminName}
        adminRole={adminRoleDisplay}
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        onToggleDesktopCollapse={() =>
          setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)
        }
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${mainContentMarginClass} transition-all duration-300 ease-in-out`}
      >
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Adjust top padding to account for sticky mobile header AND sticky desktop header */}
          <div className="pt-[65px] lg:pt-0">
            {" "}
            {/* Mobile header is ~65px. Desktop header is part of this scrollable main if sticky is only on mobile */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
