// src/components/ui/client/Notifications.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; // Keep Link if your notifications have 'link' properties
import {
  Bell,
  MailCheck,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  SettingsIcon as Settings, // Renamed to avoid conflict
  CheckCheck,
  X,
  Archive,
  ArrowRight,
  ArrowLeft,
  Loader2, // Added Loader2
} from "lucide-react";
import toast from "react-hot-toast"; // For user feedback

// Interface for a single notification from API (matches Prisma model closely)
// Frontend NotificationItem will be derived from this
export interface NotificationFromAPI {
  id: string;
  type: string; // Comes as uppercase string from Prisma enum
  title: string;
  message: string;
  timestamp: string; // Comes as ISO string from API
  isRead: boolean; // 'read' in Prisma, map to 'isRead'
  sender?: string | null;
  link?: string | null;
  // photoUrl?: string | null; // If you use this for icons or images
}

// Frontend's internal NotificationItem structure
export interface NotificationItem {
  id: string;
  type: "booking" | "message" | "promo" | "alert" | "update" | "general"; // Add 'general'
  title: string;
  message: string;
  timestamp: Date; // Convert ISO string to Date
  isRead: boolean;
  sender?: string;
  link?: string;
}

const timeAgo = (date: Date): string => {
  /* ... same as before ... */
};
const NotificationIcon: React.FC<{
  type: NotificationItem["type"];
  isRead: boolean;
}> = ({ type, isRead }) => {
  /* ... same as before, ensure 'general' case is handled ... */
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
      return <Bell className={`${iconSize} ${iconColor}`} />; // General
  }
};

const mapApiToNotificationItem = (
  apiItem: NotificationFromAPI
): NotificationItem => ({
  id: apiItem.id,
  type: apiItem.type.toLowerCase() as NotificationItem["type"], // Convert to lowercase string union
  title: apiItem.title,
  message: apiItem.message,
  timestamp: new Date(apiItem.timestamp), // Convert ISO string to Date object
  isRead: apiItem.isRead,
  sender: apiItem.sender || undefined,
  link: apiItem.link || undefined,
});

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeNotification, setActiveNotification] =
    useState<NotificationItem | null>(null);
  const [showDetailViewOnMobile, setShowDetailViewOnMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For actions like mark read/archive

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/client/notifications");
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data: NotificationFromAPI[] = await response.json();
        setNotifications(
          data
            .map(mapApiToNotificationItem)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        );
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Could not load notifications.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    /* ... handleResize logic for mobile view ... same as before */
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowDetailViewOnMobile(false);
      } else {
        setShowDetailViewOnMobile(!!activeNotification);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeNotification]);

  const handleSelectNotification = async (notification: NotificationItem) => {
    setActiveNotification(notification);
    if (!notification.isRead) {
      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      // Call API to mark as read
      try {
        await fetch(`/api/client/notifications/${notification.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readStatus: true }),
        });
        // No need to refetch, UI is already updated
      } catch (error) {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to update read status.");
        // Revert optimistic update if API call fails
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: false } : n
          )
        );
      }
    }
  };

  const handleToggleRead = async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    const newReadStatus = !notification.isRead;
    // Optimistic UI update
    const originalNotifications = [...notifications];
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: newReadStatus } : n))
    );
    if (activeNotification?.id === id) {
      setActiveNotification((prev) =>
        prev ? { ...prev, isRead: newReadStatus } : null
      );
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/client/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readStatus: newReadStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      // Success, UI already updated
    } catch (error) {
      console.error("Error toggling read status:", error);
      toast.error("Failed to update read status.");
      setNotifications(originalNotifications); // Revert on error
      if (activeNotification?.id === id) {
        // Revert active notification too
        setActiveNotification(notifications.find((n) => n.id === id) || null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    const originalNotifications = [...notifications];
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (activeNotification) {
      setActiveNotification((prev) =>
        prev ? { ...prev, isRead: true } : null
      );
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/client/notifications", {
        method: "POST",
      }); // POST to root implies mark all read
      if (!response.ok) throw new Error("Failed to mark all as read");
      // Success
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read.");
      setNotifications(originalNotifications); // Revert on error
      // Revert active notification if it was affected
      if (
        activeNotification &&
        originalNotifications.find((n) => n.id === activeNotification.id)
          ?.isRead === false
      ) {
        setActiveNotification(
          originalNotifications.find((n) => n.id === activeNotification.id) ||
            null
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveNotification = async (id: string) => {
    const originalNotifications = [...notifications];
    // Optimistic UI update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/client/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to archive notification");
      toast.success("Notification archived.");
    } catch (error) {
      console.error("Error archiving notification:", error);
      toast.error("Failed to archive notification.");
      setNotifications(originalNotifications); // Revert on error
      // If active was archived and error occurred, re-select it if it was active
      if (
        originalNotifications.find((n) => n.id === id) &&
        activeNotification?.id === id
      ) {
        setActiveNotification(
          originalNotifications.find((n) => n.id === id) || null
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed the demo useEffect that added notifications locally

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        {/* Keep background consistent during load */}
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
        <div className="relative z-10 flex items-center">
          <Loader2 size={48} className="text-amber-400 animate-spin" />
          <p className="ml-3 text-xl text-amber-300">
            Loading Notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    // ... (Your existing JSX structure for the Notifications page) ...
    // Make sure to use the `isSubmitting` state to disable buttons during API calls where appropriate.
    // Example for "Mark all as read" button:
    // disabled={unreadCount === 0 || isSubmitting}

    // Example for action buttons in detail view:
    // <button onClick={() => handleToggleRead(activeNotification.id)} disabled={isSubmitting} ... >
    // <button onClick={() => handleArchiveNotification(activeNotification.id)} disabled={isSubmitting} ... >
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
              disabled={unreadCount === 0 || isSubmitting} // Updated disabled state
              className="w-full flex items-center justify-center gap-2 px-3 py-2 lg:px-4 text-sm rounded-lg bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600 hover:border-amber-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && activeTab === "all" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Mark all as read
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
              <button
                onClick={() => setActiveNotification(null)}
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
                    disabled={isSubmitting} // Updated
                    title={
                      activeNotification.isRead
                        ? "Mark as Unread"
                        : "Mark as Read"
                    }
                    className="p-2 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-amber-400 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting &&
                    activeNotification.id === activeNotification?.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : activeNotification.isRead ? (
                      <MailCheck className="w-5 h-5" />
                    ) : (
                      <CheckCheck className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleArchiveNotification(activeNotification.id)
                    }
                    disabled={isSubmitting} // Updated
                    title="Archive Notification"
                    className="p-2 rounded-lg text-gray-300 hover:bg-gray-700/50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting &&
                    activeNotification.id === activeNotification?.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Archive className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800/50 pr-1 lg:pr-2">
                <p>{activeNotification.message}</p>
              </div>
              {activeNotification.link && (
                <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-700/50">
                  <Link // Changed <a> to <Link> for Next.js internal navigation if applicable
                    href={activeNotification.link}
                    // target={activeNotification.link.startsWith('http') ? "_blank" : "_self"} // Open external links in new tab
                    // rel={activeNotification.link.startsWith('http') ? "noopener noreferrer" : ""}
                    className="inline-flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg shadow-amber-500/20 transition-all duration-200 transform hover:scale-105 text-sm lg:text-base"
                  >
                    View Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
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
