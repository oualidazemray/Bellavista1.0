// src/app/client/layout.tsx
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ResponsiveNavbar, {
  NAV_ITEMS,
  NavItemId,
} from "@/components/ui/client/ResponsiveNavbar"; // Ensure this path is correct
import { useSession, signOut } from "next-auth/react"; // Import NextAuth hooks
import { Loader2 } from "lucide-react"; // For loading state

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession(); // Get session data and status

  // Function to determine active item from pathname
  const determineActiveItem = (currentPath: string): NavItemId => {
    const pathSegments = currentPath.split("/").filter(Boolean);
    // Default to first item (e.g., 'reservations' mapped to 'dashboard')
    let activeId: NavItemId = NAV_ITEMS[0].id;

    if (pathSegments.length >= 2 && pathSegments[0] === "client") {
      const section = pathSegments[1] as NavItemId;
      // Handle 'dashboard' specifically if it maps to 'reservations' or another ID
      if (
        section === "dashboard" &&
        NAV_ITEMS.some((item) => item.id === "reservations")
      ) {
        activeId = "reservations";
      } else {
        const matchedItem = NAV_ITEMS.find((item) => item.id === section);
        if (matchedItem) {
          activeId = matchedItem.id;
        }
      }
    }
    return activeId;
  };

  const [activeNavItem, setActiveNavItem] = useState<NavItemId>(
    determineActiveItem(pathname)
  );

  // Update activeNavItem when the pathname changes
  useEffect(() => {
    setActiveNavItem(determineActiveItem(pathname));
  }, [pathname]);

  const handleNavItemSelect = async (itemId: NavItemId) => {
    if (itemId === "logout") {
      await signOut({ callbackUrl: "/auth/login" }); // Use NextAuth's signOut
    } else {
      // setActiveNavItem(itemId); // Visually update immediately (optional, as useEffect will catch it)
      if (itemId === "reservations") {
        // If 'reservations' is your dashboard/default view
        router.push("/client/dashboard");
      } else {
        router.push(`/client/${itemId}`);
      }
    }
  };

  // Handle loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-amber-300">
        <Loader2 className="w-12 h-12 animate-spin mr-3" />
        Loading session...
      </div>
    );
  }

  // Handle unauthenticated state - Middleware should ideally redirect before this point for protected routes
  // This is a client-side fallback.
  if (status === "unauthenticated") {
    // Only redirect if not already on an auth page to prevent loops
    if (!pathname.startsWith("/auth")) {
      router.replace("/auth/login?error=SessionNotFoundInLayout");
      return (
        // Return a loading/redirecting message while redirect happens
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-amber-300">
          Redirecting to login...
        </div>
      );
    }
    // If on an auth page, allow children (e.g. login page itself) to render without navbar
    // Or, if this layout is *only* for protected areas, this state shouldn't really be hit
    // if middleware is effective.
  }

  // Extract user details from session, providing fallbacks
  const userName = session?.user?.name || "Guest";
  // Capitalize first letter of role for display, default to "User"
  const userRoleDisplay =
    session?.user?.role && typeof session.user.role === "string"
      ? session.user.role.charAt(0).toUpperCase() +
        session.user.role.slice(1).toLowerCase()
      : "User";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {status === "authenticated" && ( // Only render navbar if authenticated
        <ResponsiveNavbar
          activeItem={activeNavItem}
          onSelectItem={handleNavItemSelect}
          userName={userName}
          userRole={userRoleDisplay} // Use the display-formatted role
        />
      )}
      <main
        className={`flex-1 ${
          status === "authenticated" ? "lg:pl-20" : ""
        } transition-all duration-500 ease-out overflow-y-auto`}
      >
        {/* pt-16 for sticky mobile nav height, lg:pt-0 to reset for desktop */}
        {/* Adjust padding based on whether navbar is shown */}
        <div
          className={`${
            status === "authenticated" ? "pt-16 lg:pt-0" : ""
          } p-4 sm:p-6 lg:p-8`}
        >
          {children}
        </div>
      </main>
    </div>
  );
};

export default ClientLayout;
