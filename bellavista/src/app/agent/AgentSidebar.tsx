// src/components/ui/agent/AgentSidebar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react"; // Added useRef
import Link from "next/link";
import {
  LayoutDashboard,
  Users as ClientsIcon,
  BedDouble,
  FileText,
  CalendarPlus,
  LogOut as LogOutIcon,
  ClipboardEdit,
  CreditCard,
  Menu,
  X,
  Briefcase,
  Zap, // Added Zap for hover hint
  // Bell, // Add if agent has notifications/alerts
} from "lucide-react";

export const AGENT_NAV_ITEMS = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Agent Overview",
    path: "/agent/dashboard",
  },
  {
    id: "new-booking",
    icon: CalendarPlus,
    label: "New Booking",
    path: "/agent/new-booking",
  },
  {
    id: "reservations",
    icon: ClipboardEdit,
    label: "Manage Bookings",
    path: "/agent/reservations",
  },
  {
    id: "availability",
    icon: BedDouble,
    label: "Room Availability",
    path: "/agent/availability",
  },
  {
    id: "clients",
    icon: ClientsIcon,
    label: "Client Accounts",
    path: "/agent/clients",
  },
  {
    id: "billing",
    icon: CreditCard,
    label: "Billing & Invoices",
    path: "/agent/billing",
  },
  { id: "logout", icon: LogOutIcon, label: "Logout", path: "#logout" },
] as const;

export type AgentNavItemId = (typeof AGENT_NAV_ITEMS)[number]["id"];

interface AgentSidebarNavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  isEffectivelyCollapsed: boolean; // New prop to reflect actual collapsed state
  hasNotification?: boolean;
  onClick: () => void;
}

const AgentSidebarNavItem: React.FC<AgentSidebarNavItemProps> = ({
  icon: Icon,
  label,
  path,
  isActive,
  isEffectivelyCollapsed,
  hasNotification = false,
  onClick,
}) => {
  const isLogout = path === "#logout";

  const content = (
    <div
      className="relative group flex items-center gap-4 px-4 py-2 rounded-xl cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100" />
      <div className="relative flex items-center gap-4 z-10 w-full">
        <div className="relative">
          <div
            className={`transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${
              isActive ? "text-cyan-400" : "group-hover:text-cyan-400"
            }`}
          >
            <Icon className="w-5 h-5 transition-colors duration-300" />
          </div>
          {hasNotification && (
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"
              style={{ animation: "notification-pulse 2s infinite" }}
            >
              <div className="w-full h-full bg-red-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        <div
          className={`flex items-center justify-between flex-1 overflow-hidden transition-all duration-300 ${
            isEffectivelyCollapsed
              ? "opacity-0 w-0 -translate-x-2"
              : "opacity-100 w-auto translate-x-0"
          }`}
        >
          <span className="text-sm font-medium tracking-wide whitespace-nowrap">
            {label}
          </span>
          {isActive && (
            <div
              className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full ml-2"
              style={{ animation: "scale-pulse 1.5s infinite" }}
            />
          )}
        </div>
      </div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 pointer-events-none" />
    </div>
  );

  return isLogout ? <div>{content}</div> : <Link href={path}>{content}</Link>;
};

interface AgentSidebarProps {
  activeItemId: AgentNavItemId;
  onSelectItem: (itemId: AgentNavItemId) => void;
  userName?: string;
  userRole?: string;
  // No longer need isDesktopCollapsed and onToggleDesktopCollapse from parent if managing hover internally
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  activeItemId,
  onSelectItem,
  userName = "Hotel Agent",
  userRole = "Reception Staff",
}) => {
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false); // For the toggle button state
  const [isHovered, setIsHovered] = useState(false); // For hover state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLElement>(null); // Ref for the aside element

  // This determines if the sidebar should actually appear collapsed
  // It's collapsed if manually toggled AND not hovered,
  // OR if not manually toggled but also not hovered (initial state before first manual toggle if starting collapsed).
  // For simplicity here: expand on hover UNLESS it was manually collapsed.
  // A more robust logic might be: if manually collapsed, hover doesn't expand. If manually expanded, hover keeps it expanded.
  // Let's try: hover expands if not manually collapsed. If manually collapsed, it stays collapsed.
  // If manually expanded (isManuallyCollapsed = false), hover doesn't change it (it's already expanded).

  // Let's simplify: Hover always tries to expand. Manual collapse overrides hover.
  const [sidebarIsEffectivelyCollapsed, setSidebarIsEffectivelyCollapsed] =
    useState(true); // Start collapsed

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isManuallyCollapsed) {
      // Only expand on hover if not manually collapsed
      setSidebarIsEffectivelyCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!isManuallyCollapsed) {
      // Only collapse on leave if not manually collapsed (and thus expanded by hover)
      setSidebarIsEffectivelyCollapsed(true);
    }
  };

  const mainNavItems = AGENT_NAV_ITEMS.filter((item) => item.id !== "logout");
  const logoutItem = AGENT_NAV_ITEMS.find((item) => item.id === "logout");

  return (
    <>
      <style jsx>{`
        /* ... keyframes ... */
        @keyframes agent-pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(34, 211, 238, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.6),
              0 0 30px rgba(59, 130, 246, 0.4);
          }
        }
        @keyframes notification-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        @keyframes scale-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.5);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes gradient-shift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .floating-bg-1 {
          animation: float 7s ease-in-out infinite;
        }
        .floating-bg-2 {
          animation: float 9s ease-in-out infinite reverse;
        }
        .gradient-animated {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-80 h-80 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl floating-bg-1"
          style={{
            left: "10%",
            top: "15%",
            transform: `translate(${mousePosition.x / 70}px, ${
              mousePosition.y / 70
            }px)`,
          }}
        />
        <div
          className="absolute w-64 h-64 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 rounded-full blur-3xl floating-bg-2"
          style={{
            right: "10%",
            bottom: "15%",
            transform: `translate(${-mousePosition.x / 100}px, ${
              -mousePosition.y / 100
            }px)`,
          }}
        />
      </div>

      <aside
        ref={sidebarRef}
        className={`hidden lg:flex fixed left-0 top-0 h-full z-[51] transition-all duration-300 ease-out 
                   ${sidebarIsEffectivelyCollapsed ? "w-20" : "w-64"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative h-full flex flex-col w-full">
          <div className="absolute inset-0 bg-slate-800/90 backdrop-blur-lg border-r border-slate-700/50 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-700/70 to-slate-800/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-blue-600/5 to-slate-800/20 opacity-70" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="p-4 border-b border-slate-700/50 flex items-center gap-3 h-16 shrink-0">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300 cursor-pointer gradient-animated">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              {!sidebarIsEffectivelyCollapsed && (
                <div className="overflow-hidden">
                  <h3
                    className="text-white font-semibold text-sm leading-tight truncate"
                    title={userName}
                  >
                    {userName}
                  </h3>
                  <p
                    className="text-slate-400 text-xs truncate"
                    title={userRole}
                  >
                    {userRole}
                  </p>
                </div>
              )}
            </div>
            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {mainNavItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`opacity-0 animate-[slideIn_0.4s_ease-out_forwards]`}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <AgentSidebarNavItem
                    icon={item.icon}
                    label={item.label}
                    path={item.path}
                    hasNotification={item.hasNotification}
                    isEffectivelyCollapsed={sidebarIsEffectivelyCollapsed} // Pass the effective state
                    isActive={activeItemId === item.id}
                    onClick={() => onSelectItem(item.id)}
                  />
                </div>
              ))}
            </nav>
            {logoutItem && (
              <div className="p-2 border-t border-slate-700/50 shrink-0">
                <AgentSidebarNavItem
                  icon={logoutItem.icon}
                  label={logoutItem.label}
                  path={logoutItem.path}
                  isEffectivelyCollapsed={sidebarIsEffectivelyCollapsed} // Pass the effective state
                  isActive={activeItemId === "logout"}
                  onClick={() => onSelectItem(logoutItem.id)}
                />
              </div>
            )}

            {/* Hover hint only if sidebar is effectively collapsed AND NOT being hovered (to avoid flicker) */}
            {sidebarIsEffectivelyCollapsed && !isHovered && (
              <div
                className="absolute right-2 top-2/3 opacity-50"
                style={{ animation: "float 2s ease-in-out infinite" }}
              >
                <Zap className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </aside>
      {/* Mobile navigation is expected to be handled by AgentLayout.tsx */}
    </>
  );
};

export default AgentSidebar;
