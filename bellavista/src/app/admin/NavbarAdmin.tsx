// src/components/ui/admin/AdminNavbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, // For Admin Dashboard
  Users, // For User Management
  ClipboardList, // For Reservations Management
  Hotel, // For Hotel Management (can also be Building2)
  BarChart3, // For Reports/Analytics
  Bell, // For Admin Alerts/Notifications
  LogOut,
  User as UserIcon, // Renamed to avoid conflict with User type if any
  Menu,
  X,
  Zap,
  ShieldAlert, // Alternative for Alerts
  Settings, // For general settings or permissions
  KeyRound, // For password resets or security
  MessageSquare as FeedbackIcon,
  Mail as MailIcon,
} from "lucide-react";

// Interface for NavItem props (can be kept the same)
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  hasNotification?: boolean;
  isCollapsed?: boolean;
  isActive?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  hasNotification = false,
  isCollapsed = false,
  isActive = false,
  onClick,
}) => (
  <div
    className={`relative flex items-center gap-4 px-4 py-3 mx-2 rounded-xl cursor-pointer transition-all duration-300 group transform hover:translate-x-1 hover:scale-105 active:scale-95 ${
      isActive
        ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-white border border-purple-500/30 shadow-lg" // Admin theme color
        : "text-slate-300 hover:text-white hover:bg-white/10 hover:shadow-md"
    }`}
    onClick={onClick}
    style={{
      animation: isActive ? "admin-pulse-glow 2s infinite" : "", // Different animation name
    }}
  >
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100" />
    <div className="relative flex items-center gap-4 z-10 w-full">
      <div className="relative">
        <div
          className={`transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${
            isActive ? "text-purple-400" : "group-hover:text-purple-400" // Admin theme color
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
          isCollapsed
            ? "opacity-0 w-0 -translate-x-2"
            : "opacity-100 w-auto translate-x-0"
        }`}
      >
        <span className="text-sm font-medium tracking-wide whitespace-nowrap">
          {label}
        </span>
        {isActive && (
          <div
            className="w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full ml-2" // Admin theme color
            style={{ animation: "scale-pulse 1.5s infinite" }}
          />
        )}
      </div>
    </div>
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 pointer-events-none" />
  </div>
);

// --- ADMIN NAVIGATION ITEMS ---
export const ADMIN_NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "User Management" }, // Covers "Gestion des accès et permissions" & "Réinitialisation mots de passe"
  { id: "reservations", icon: ClipboardList, label: "Reservations" }, // For "Validation / rejet des réservation"
  { id: "hotels", icon: Hotel, label: "Hotel Management" }, // For "Gestion des hôtels"
  { id: "reports", icon: BarChart3, label: "Reports & Analytics" }, // For "Visualisation graphique"
  {
    id: "alerts",
    icon: ShieldAlert,
    label: "System Alerts",
    hasNotification: true,
  },
  {
    id: "send-custom-notification",
    icon: MailIcon,
    label: "Send Notification",
    path: "/admin/send-notification",
  },
  {
    id: "feedbacks",
    icon: FeedbackIcon,
    label: "User Feedbacks",
    path: "/admin/feedbacks",
  }, // For "Système d'alerte"
  // { id: "settings", icon: Settings, label: "Settings" }, // Optional general settings
  { id: "logout", icon: LogOut, label: "Logout" },
] as const;

export type AdminNavItemId = (typeof ADMIN_NAV_ITEMS)[number]["id"];

interface AdminNavbarProps {
  activeItem: AdminNavItemId;
  onSelectItem: (itemId: AdminNavItemId) => void;
  adminName?: string;
  adminRole?: string; // e.g., "Administrator", "Super Admin"
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({
  activeItem,
  onSelectItem,
  adminName = "Admin User",
  adminRole = "Administrator",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const mainNavItems = ADMIN_NAV_ITEMS.filter((item) => item.id !== "logout");
  const logoutItem = ADMIN_NAV_ITEMS.find((item) => item.id === "logout");

  const getActiveLabel = () => {
    return (
      ADMIN_NAV_ITEMS.find((item) => item.id === activeItem)?.label ||
      "Admin Menu"
    );
  };

  const handleMobileItemClick = (itemId: AdminNavItemId) => {
    onSelectItem(itemId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <style jsx>{`
        /* ... (pulse-glow, notification-pulse, scale-pulse, float, gradient-shift, slideIn keyframes) ... */
        /* You might want a distinct pulse-glow for admin */
        @keyframes admin-pulse-glow {
          /* Different name for admin theme */
          0%,
          100% {
            box-shadow: 0 0 5px rgba(167, 139, 250, 0.3);
          } /* purple-ish */
          50% {
            box-shadow: 0 0 20px rgba(167, 139, 250, 0.6),
              0 0 30px rgba(129, 140, 248, 0.4);
          } /* indigo-ish */
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
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
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
          animation: float 6s ease-in-out infinite;
        }
        .floating-bg-2 {
          animation: float 8s ease-in-out infinite reverse;
        }
        .gradient-animated {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
      `}</style>

      {/* Animated background elements - consider different colors for admin */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 rounded-full blur-3xl floating-bg-1" // Admin theme
          style={{
            left: "15%",
            top: "25%",
            transform: `translate(${mousePosition.x / 60}px, ${
              mousePosition.y / 60
            }px)`,
          }}
        />
        <div
          className="absolute w-72 h-72 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-full blur-3xl floating-bg-2" // Admin theme
          style={{
            right: "15%",
            bottom: "25%",
            transform: `translate(${-mousePosition.x / 90}px, ${
              -mousePosition.y / 90
            }px)`,
          }}
        />
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex fixed left-0 top-0 h-full z-50 transition-all duration-500 ease-out ${
          isHovered ? "w-72" : "w-20"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-full flex flex-col w-full">
          {/* Admin Theme Background Styling */}
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xl border-r border-slate-700 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/60 to-slate-900/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-indigo-600/5 to-slate-900/20 opacity-60" />
          </div>

          <div className="relative z-10 h-full flex flex-col">
            {/* Profile Section */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg transform hover:scale-110 hover:rotate-3 transition-all duration-300 cursor-pointer gradient-animated">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div
                  className={`overflow-hidden transition-all duration-500 ${
                    isHovered
                      ? "opacity-100 translate-x-0 w-auto"
                      : "opacity-0 -translate-x-4 w-0"
                  }`}
                >
                  <h3
                    className="text-white font-semibold text-lg truncate"
                    title={adminName}
                  >
                    {adminName}
                  </h3>
                  <p
                    className="text-slate-400 text-sm truncate"
                    title={adminRole}
                  >
                    {adminRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-6 space-y-2">
              {mainNavItems.map((item, index) => (
                <div
                  key={item.id}
                  className="opacity-0 -translate-x-4 animate-[slideIn_0.5s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    hasNotification={item.hasNotification}
                    isCollapsed={!isHovered}
                    isActive={activeItem === item.id}
                    onClick={() => onSelectItem(item.id)}
                  />
                </div>
              ))}
            </nav>

            {/* Logout Section */}
            {logoutItem && (
              <div className="p-4 border-t border-slate-700">
                <div className="transform hover:scale-105 active:scale-95 transition-transform duration-200">
                  <NavItem
                    icon={logoutItem.icon}
                    label={logoutItem.label}
                    isCollapsed={!isHovered}
                    isActive={activeItem === logoutItem.id}
                    onClick={() => onSelectItem(logoutItem.id)}
                  />
                </div>
              </div>
            )}
            {!isHovered && (
              <div
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-50"
                style={{ animation: "float 2s ease-in-out infinite" }}
              >
                <Zap className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Top Navbar */}
      <div className="lg:hidden sticky top-0 z-40">
        <div className="relative bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/90 to-slate-900/90" />
          <div className="relative z-10 flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg active:scale-90 transition-transform duration-200 gradient-animated">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">
                  {getActiveLabel()}
                </h1>
                <p className="text-slate-400 text-xs">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-300 active:scale-90"
            >
              <div
                className={`transform transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-180" : "rotate-0"
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </div>
            </button>
          </div>
          <div
            className={`overflow-hidden border-t border-slate-700 bg-slate-900/98 backdrop-blur-xl transition-all duration-500 ease-out ${
              isMobileMenuOpen ? "max-h-screen py-4" : "max-h-0 py-0"
            }`}
          >
            {" "}
            {/* Adjusted max-h */}
            <div className="space-y-1">
              {mainNavItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`transform transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 0.05}s` }}
                  onClick={() => handleMobileItemClick(item.id)}
                >
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    hasNotification={item.hasNotification}
                    isActive={activeItem === item.id}
                    onClick={() => {}}
                  />
                </div>
              ))}
              {logoutItem && (
                <div
                  className="border-t border-slate-700 mt-4 pt-4"
                  onClick={() => handleMobileItemClick(logoutItem.id)}
                >
                  <NavItem
                    icon={logoutItem.icon}
                    label={logoutItem.label}
                    isActive={activeItem === logoutItem.id}
                    onClick={() => {}}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminNavbar;
