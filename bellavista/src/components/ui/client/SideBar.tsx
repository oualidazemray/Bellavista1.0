import { useState, useEffect } from "react";
import {
  Bell,
  Clock,
  UserCircle,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile menu toggle */}
      {isMobile && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed top-4 left-4 z-50 bg-amber-800 text-amber-100 rounded-full p-2 shadow-lg"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Backdrop for mobile */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 bottom-0 left-0 z-40
          bg-gradient-to-b from-amber-950 to-amber-900
          border-r border-amber-700/30
          flex flex-col
          transition-all duration-300 ease-in-out
          shadow-xl
          ${isExpanded ? "w-64" : "w-20"}
          ${isMobile && !isExpanded ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        {/* Top section with logo and toggle */}
        <div className="p-4 flex items-center justify-between border-b border-amber-800/30">
          <div className="flex items-center space-x-2">
            <div className="text-amber-200 font-serif text-xl">
              {isExpanded ? "BELLAVISTA" : "B"}
            </div>
            {isExpanded && <span className="text-amber-200">✦</span>}
          </div>

          {!isMobile && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-amber-200 hover:text-amber-100 transition-colors"
            >
              <ChevronLeft
                size={20}
                className={`transition-transform ${
                  isExpanded ? "" : "rotate-180"
                }`}
              />
            </button>
          )}

          {isMobile && isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-amber-200 hover:text-amber-100 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {/* Profile section */}
        <div
          className={`mt-8 flex ${
            isExpanded ? "justify-between px-6" : "justify-center"
          } items-center`}
        >
          {isExpanded && (
            <span className="text-amber-200/80 font-serif text-sm">
              My Profile
            </span>
          )}
          <div className="rounded-full bg-amber-800/40 p-1 ring-1 ring-amber-700/50">
            <UserCircle
              className="text-amber-200"
              size={isExpanded ? 28 : 24}
            />
          </div>
        </div>

        {/* Decorative element */}
        <div className="relative h-px w-full bg-gradient-to-r from-transparent via-amber-700/30 to-transparent my-6"></div>

        {/* Navigation menu */}
        <div className="flex-grow px-3 py-6 flex flex-col">
          <div className="space-y-5">
            <MenuItem
              icon={<Bell size={18} />}
              label="Notifications"
              isExpanded={isExpanded}
              badge={3}
            />
            <MenuItem
              icon={<Clock size={18} />}
              label="Historic"
              isExpanded={isExpanded}
            />
            <MenuItem
              icon={<UserCircle size={18} />}
              label="Edit profile"
              isExpanded={isExpanded}
            />
            <MenuItem
              icon={<CalendarDays size={18} />}
              label="Booking"
              isExpanded={isExpanded}
            />
            <MenuItem
              icon={<Users size={18} />}
              label="Facilities"
              isExpanded={isExpanded}
            />
          </div>
        </div>

        {/* Curved edge decoration */}
        <div className="absolute right-0 top-1/3 h-64 w-8 overflow-hidden pointer-events-none">
          <div className="h-full w-16 rounded-l-full bg-gradient-to-r from-transparent to-amber-800/20"></div>
        </div>

        {/* Bottom section with logout */}
        <div className="mt-auto border-t border-amber-800/30 p-4">
          <div
            className={`flex items-center ${
              isExpanded ? "justify-between" : "justify-center"
            } py-2`}
          >
            {isExpanded && (
              <span className="text-amber-200 font-serif">Log Out</span>
            )}
            <LogOut className="text-amber-200" size={18} />
          </div>
        </div>
      </div>
    </>
  );
}

function MenuItem({ icon, label, isExpanded, badge }) {
  return (
    <div
      className={`
      flex items-center py-2 px-1 rounded-lg
      ${isExpanded ? "justify-between" : "justify-center"}
      group hover:bg-amber-800/20 transition-colors
    `}
    >
      {isExpanded ? (
        <>
          <div className="flex items-center">
            <div className="text-amber-200 w-8">{icon}</div>
            <span className="text-amber-200 font-serif ml-2">{label}</span>
          </div>
          {badge && (
            <div className="bg-amber-200 text-amber-950 text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {badge}
            </div>
          )}
        </>
      ) : (
        <div className="relative">
          <div className="text-amber-200">{icon}</div>
          {badge && (
            <div className="absolute -top-1 -right-1 bg-amber-200 text-amber-950 text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {badge}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
