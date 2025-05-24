// src/components/ui/client/Notifications.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Bell,
  MailCheck,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Settings,
  CheckCheck,
  X, // Keep if needed for a potential close button for the whole component
  Archive,
  ArrowRight,
  ArrowLeft, // For back button on mobile
} from "lucide-react";

// Interface for a single notification
export interface NotificationItem {
  id: string;
  type: "booking" | "message" | "promo" | "alert" | "update";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  sender?: string;
  link?: string; // Optional link for "View Details"
}

// Sample notifications data (same as before)
const initialNotificationsData: NotificationItem[] = [
  {
    id: "1",
    type: "booking",
    title: "Booking Confirmed: The Grand Oasis",
    message:
      "Your 3-night stay starting on 2023-12-20 has been confirmed. We look forward to welcoming you!",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    isRead: false,
    sender: "Booking System",
    link: "/bookings/123",
  },
  {
    id: "2",
    type: "message",
    title: "New Message from Support",
    message:
      "Regarding your recent inquiry, we have updated our FAQ section...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: false,
    sender: "Customer Support",
  },
  {
    id: "3",
    type: "promo",
    title: "Exclusive Offer: 20% Off Your Next Stay!",
    message:
      "Use code WINTER20 to get a 20% discount on stays booked before January 31st.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true,
    sender: "Marketing Team",
  },
  {
    id: "4",
    type: "alert",
    title: "Important: Account Security Update",
    message:
      "We've detected unusual activity on your account. Please review your recent logins.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    isRead: false,
    sender: "Security Team",
    link: "/account/security",
  },
  {
    id: "5",
    type: "update",
    title: "New Feature: Dark Mode",
    message:
      "You can now enjoy our platform in a sleek new dark mode. Check your settings!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    isRead: true,
    sender: "Product Team",
  },
];

// Helper to format time ago (same as before)
const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const NotificationIcon: React.FC<{
  type: NotificationItem["type"];
  isRead: boolean;
}> = ({ type, isRead }) => {
  const iconColor = isRead ? "text-gray-500" : "text-amber-400";
  const iconSize = "w-5 h-5";

  switch (type) {
    case "booking":
      return <MailCheck className={`${iconSize} ${iconColor}`} />;
    case "message":
      return <MessageSquare className={`${iconSize} ${iconColor}`} />;
    case "promo":
      return <Sparkles className={`${iconSize} ${iconColor}`} />;
    case "alert":
      return <AlertTriangle className={`${iconSize} ${iconColor}`} />;
    case "update":
      return <Settings className={`${iconSize} ${iconColor}`} />;
    default:
      return <Bell className={`${iconSize} ${iconColor}`} />;
  }
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotificationsData
  );
  const [activeNotification, setActiveNotification] =
    useState<NotificationItem | null>(null);
  // State to manage view switching on mobile
  const [showDetailViewOnMobile, setShowDetailViewOnMobile] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Effect to handle view mode based on screen size and active notification
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Tailwind's lg breakpoint
        setShowDetailViewOnMobile(false); // On large screens, always allow two-pane
      } else {
        // On small screens, show detail if a notification is active, otherwise show list
        setShowDetailViewOnMobile(!!activeNotification);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeNotification]);

  const handleSelectNotification = (notification: NotificationItem) => {
    setActiveNotification(notification);
    if (!notification.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }
    // The useEffect will handle setShowDetailViewOnMobile based on new activeNotification
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
    if (activeNotification?.id === id) {
      setActiveNotification((prev) =>
        prev ? { ...prev, isRead: !prev.isRead } : null
      );
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (activeNotification) {
      setActiveNotification((prev) =>
        prev ? { ...prev, isRead: true } : null
      );
    }
  };

  const handleArchiveNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activeNotification?.id === id) {
      setActiveNotification(null); // This will trigger useEffect to update mobile view
    }
  };

  // Simulate receiving new notifications (optional, for demo)
  useEffect(() => {
    const intervalId = setInterval(() => {
      const newId = (notifications.length + 1 + Math.random()).toString();
      const types: NotificationItem["type"][] = [
        "booking",
        "message",
        "promo",
        "alert",
        "update",
      ];
      const randomType = types[Math.floor(Math.random() * types.length)];

      if (notifications.length > 10) {
        // Cap notifications for demo
        clearInterval(intervalId);
        return;
      }

      setNotifications((prev) => [
        {
          id: newId,
          type: randomType,
          title: `New ${randomType} ${newId.substring(0, 2)}`,
          message:
            "This is a dynamically added notification for demo purposes.",
          timestamp: new Date(),
          isRead: false,
          sender: "System Bot",
        },
        ...prev,
      ]);
    }, 45000); // Add a new notification every 45 seconds
    return () => clearInterval(intervalId);
  }, [notifications.length]); // Re-run if notifications length changes to restart interval if capped

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 z-0">
        <Image
          src="/beachBack.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          priority
        />
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 w-full max-w-5xl h-full lg:h-[85vh] bg-[#18130f]/90 backdrop-blur-md rounded-xl lg:rounded-2xl shadow-2xl shadow-amber-700/20 flex overflow-hidden border border-amber-500/30">
        {/* Sidebar / Notification List */}
        <div
          className={`
            ${showDetailViewOnMobile ? "hidden" : "flex"} lg:flex 
            w-full lg:w-1/3 flex-col 
            border-gray-700/50 lg:border-r`}
        >
          <div className="p-4 lg:p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="p-2 lg:p-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg lg:rounded-xl shadow-lg shadow-amber-400/30">
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-black" />
                </div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Inbox
                </h1>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 lg:px-3 lg:py-1 text-xs font-semibold text-black bg-amber-400 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 lg:px-4 text-sm rounded-lg bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600 hover:border-amber-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-2 lg:p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50">
            {notifications.length === 0 && (
              <p className="text-center text-gray-400 py-10">
                No notifications yet.
              </p>
            )}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleSelectNotification(notification)}
                className={`p-3 lg:p-4 rounded-lg cursor-pointer transition-all duration-200 border
                  ${
                    activeNotification?.id === notification.id &&
                    !showDetailViewOnMobile
                      ? "bg-amber-900/50 border-amber-500/70 shadow-md shadow-amber-500/10"
                      : "border-gray-700/50 hover:bg-gray-700/30 hover:border-gray-600"
                  }
                  ${
                    !notification.isRead &&
                    (activeNotification?.id !== notification.id ||
                      showDetailViewOnMobile)
                      ? "border-l-4 border-l-amber-400"
                      : ""
                  }`}
              >
                <div className="flex items-start gap-2 lg:gap-3">
                  {!notification.isRead &&
                    (activeNotification?.id !== notification.id ||
                      showDetailViewOnMobile) && (
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-400 flex-shrink-0"></div>
                    )}
                  {(notification.isRead ||
                    (activeNotification?.id === notification.id &&
                      !showDetailViewOnMobile)) && (
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-transparent flex-shrink-0"></div>
                  )}

                  <div className="flex-shrink-0 pt-0.5">
                    <NotificationIcon
                      type={notification.type}
                      isRead={notification.isRead}
                    />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h3
                        className={`font-semibold truncate ${
                          notification.isRead ? "text-gray-300" : "text-white"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {timeAgo(notification.timestamp)}
                      </span>
                    </div>
                    {notification.sender && (
                      <p className="text-xs text-amber-400/80 mb-1">
                        {notification.sender}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 truncate">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content / Notification Detail View */}
        <div
          className={`
            ${showDetailViewOnMobile ? "flex" : "hidden"} lg:flex 
            w-full lg:w-2/3 flex-col bg-[#100c0a]/50`}
        >
          {activeNotification ? (
            <div className="p-4 lg:p-8 flex flex-col h-full">
              {" "}
              {/* Added h-full for flex children to grow */}
              {/* Back Button for Mobile */}
              <button
                onClick={() => setActiveNotification(null)} // This will trigger useEffect to hide detail view on mobile
                className="lg:hidden mb-4 p-2 bg-gray-700/50 rounded-md text-amber-400 hover:bg-gray-600/70 self-start flex items-center gap-1"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <div className="flex justify-between items-start mb-4 lg:mb-6 pb-4 lg:pb-6 border-b border-gray-700/50">
                <div>
                  <div className="flex items-center gap-2 lg:gap-3 mb-1">
                    <NotificationIcon
                      type={activeNotification.type}
                      isRead={activeNotification.isRead}
                    />
                    <h2 className="text-xl lg:text-2xl font-bold text-amber-400">
                      {activeNotification.title}
                    </h2>
                  </div>
                  <p className="text-xs lg:text-sm text-gray-400">
                    From: {activeNotification.sender || "System"} • Received:{" "}
                    {timeAgo(activeNotification.timestamp)}
                  </p>
                </div>
                <div className="flex gap-1 lg:gap-2">
                  <button
                    onClick={() => handleToggleRead(activeNotification.id)}
                    title={
                      activeNotification.isRead
                        ? "Mark as Unread"
                        : "Mark as Read"
                    }
                    className="p-2 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-amber-400 transition-colors"
                  >
                    {activeNotification.isRead ? (
                      <MailCheck className="w-5 h-5" />
                    ) : (
                      <CheckCheck className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleArchiveNotification(activeNotification.id)
                    }
                    title="Archive Notification"
                    className="p-2 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-red-500 transition-colors"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50 pr-1 lg:pr-2">
                <p>{activeNotification.message}</p>
              </div>
              {activeNotification.link && (
                <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-700/50">
                  <a
                    href={activeNotification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg shadow-amber-500/20 transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            // This placeholder is primarily for desktop when no notification is selected.
            // On mobile, this pane is hidden if activeNotification is null.
            <div className="hidden lg:flex flex-grow flex-col items-center justify-center text-center text-gray-500 p-4 lg:p-8">
              <Bell className="w-16 h-16 lg:w-24 lg:h-24 mb-4 opacity-20" />
              <h3 className="text-lg lg:text-xl font-semibold">
                Select a notification
              </h3>
              <p className="text-sm lg:text-base">
                Choose a notification from the list to see its details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
