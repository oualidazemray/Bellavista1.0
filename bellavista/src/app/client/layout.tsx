// src/app/client/layout.tsx
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ResponsiveNavbar, {
  NAV_ITEMS,
  NavItemId,
} from "@/components/ui/client/ResponsiveNavbar";

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [activeNavItem, setActiveNavItem] = useState<NavItemId>(
    NAV_ITEMS[0].id
  ); // Default to first item

  useEffect(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    let currentMainSection: NavItemId = NAV_ITEMS[0].id; // Fallback to the first item

    if (pathSegments.length >= 2 && pathSegments[0] === "client") {
      const section = pathSegments[1] as NavItemId;
      const matchedItem = NAV_ITEMS.find((item) => item.id === section);
      if (matchedItem) {
        currentMainSection = matchedItem.id;
      }
    }
    setActiveNavItem(currentMainSection);
  }, [pathname]);

  const handleNavItemSelect = (itemId: NavItemId) => {
    if (itemId === "logout") {
      // Implement actual logout logic here (e.g., clear session, API call)
      console.log("Logout action initiated");
      router.push("/auth/login"); // Or your desired logout/redirect page
    } else {
      router.push(`/client/${itemId}`);
    }
  };

  // Example user data - in a real app, this would come from auth context or session
  const userData = {
    name: "Khalil A.", // Keep it shorter for mobile view
    role: "Client",
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ResponsiveNavbar
        activeItem={activeNavItem}
        onSelectItem={handleNavItemSelect}
        userName={userData.name}
        userRole={userData.role}
      />
      <main className="flex-1 lg:pl-10  transition-all duration-500 ease-out overflow-y-auto">
        {/* pt-16 for sticky mobile nav height, lg:pt-0 to reset for desktop */}
        <div className=" lg:pt-0  sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default ClientLayout;
