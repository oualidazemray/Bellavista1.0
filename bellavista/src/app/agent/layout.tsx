// src/app/agent/layout.tsx
"use client";

import React, { ReactNode, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
// We'll create an AgentSidebar component
import AgentSidebar, { AGENT_NAV_ITEMS, AgentNavItemId } from "./AgentSidebar"; // Adjust path
import { useSession, signOut } from "next-auth/react";
import { Loader2, UserCircle, Menu, X, Briefcase } from "lucide-react";
import Link from "next/link";

interface AgentLayoutProps {
  children: ReactNode;
}

const AgentLayout: React.FC<AgentLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace(
        "/auth/login?error=AgentSessionRequired&callbackUrl=/agent/dashboard"
      );
    },
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
    useState(false);

  const determineActiveAgentItem = useCallback((): AgentNavItemId => {
    const segments = pathname.split("/").filter(Boolean);
    let currentSection: AgentNavItemId = AGENT_NAV_ITEMS[0].id; // Default to first item

    if (segments.length >= 2 && segments[0] === "agent") {
      const sectionId = segments[1] as AgentNavItemId;
      const matchedItem = AGENT_NAV_ITEMS.find((item) => item.id === sectionId);
      if (matchedItem) {
        currentSection = matchedItem.id;
      } else if (segments.length === 1 && segments[0] === "agent") {
        currentSection =
          AGENT_NAV_ITEMS.find((item) => item.id === "dashboard")?.id ||
          AGENT_NAV_ITEMS[0].id;
      }
    }
    return currentSection;
  }, [pathname]);

  const [activeAgentItem, setActiveAgentItem] = useState<AgentNavItemId>(
    determineActiveAgentItem()
  );

  useEffect(() => {
    setActiveAgentItem(determineActiveAgentItem());
  }, [pathname, determineActiveAgentItem]);

  const handleAgentNavItemSelect = async (itemId: AgentNavItemId) => {
    setIsMobileMenuOpen(false);
    if (itemId === "logout") {
      await signOut({ callbackUrl: "/auth/login" });
    } else {
      const targetPath = AGENT_NAV_ITEMS.find(
        (item) => item.id === itemId
      )?.path;
      if (targetPath) {
        router.push(targetPath);
      } else {
        router.push(`/agent/${itemId}`);
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-cyan-300">
        <Loader2 className="w-12 h-12 animate-spin mr-3" />
        Loading Agent Session...
      </div>
    );
  }
  if (status === "authenticated" && session?.user?.role !== "AGENT") {
    console.warn(
      "AGENT_LAYOUT: Non-agent user accessed. Session role:",
      session?.user?.role
    );
    router.replace("/auth/login?error=AgentAccessDenied");
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-red-400">
        Access Denied. Redirecting...
      </div>
    );
  }
  if (status !== "authenticated" || session?.user?.role !== "AGENT") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-cyan-300">
        Authenticating Agent...
      </div>
    );
  }

  const agentName = session.user.name || "Agent";
  const agentRoleDisplay = "Reception Agent"; // Or specific agent title

  const mainContentMarginClass = isDesktopSidebarCollapsed
    ? "lg:ml-20"
    : "lg:ml-64";

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      <AgentSidebar
        activeItemId={activeAgentItem}
        onSelectItem={handleAgentNavItemSelect}
        userName={agentName}
        userRole={agentRoleDisplay}
      />

      <main
        className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${mainContentMarginClass} transition-all duration-300 ease-in-out`}
      >
        <div className="pt-[65px] lg:pt-0"> {children} </div>
      </main>
    </div>
  );
};

export default AgentLayout;
