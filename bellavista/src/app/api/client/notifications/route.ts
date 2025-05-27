// src/app/api/client/notifications/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
// Assuming NotificationItem from your frontend is what you want to shape the API response to
// If NotificationType enum is used in Prisma and needed for mapping:
// import { NotificationType as PrismaNotificationType } from '@prisma/client';

// This interface should match what your frontend Notifications.tsx expects after mapping
interface MappedNotificationItem {
  id: string;
  type: "booking" | "message" | "promo" | "alert" | "update" | "general"; // Match frontend type
  title: string;
  message: string;
  timestamp: string; // Keep as ISO string for API, frontend will convert to Date
  isRead: boolean;
  sender?: string | null;
  link?: string | null;
}

export async function GET(request: NextRequest) {
  console.log("API_NOTIFICATIONS_GET: Handler started.");
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log("API_NOTIFICATIONS_GET: Token from getToken:", token);

    if (!token || !token.id || token.role !== "CLIENT") {
      console.log("API_NOTIFICATIONS_GET: Unauthorized access. Token:", token);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = token.id as string;
    console.log(`API_NOTIFICATIONS_GET: Authorized for user ID: ${userId}`);

    const notificationsFromDb = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });
    console.log(
      `API_NOTIFICATIONS_GET: Fetched ${notificationsFromDb.length} notifications from DB.`
    );

    // Map Prisma model to the structure your frontend NotificationItem expects
    // (after the frontend converts timestamp string to Date and type to lowercase)
    const mappedNotifications: MappedNotificationItem[] =
      notificationsFromDb.map((n) => {
        // console.log("API_NOTIFICATIONS_GET: Mapping notification:", n); // Log each item before mapping
        return {
          id: n.id,
          // Assuming 'n.type' from Prisma is an enum like BOOKING, MESSAGE, etc.
          // And frontend NotificationItem['type'] is lowercase string union.
          type: n.type.toLowerCase() as MappedNotificationItem["type"],
          title: n.title,
          message: n.message,
          timestamp: n.createdAt.toISOString(), // Send as ISO string
          isRead: n.read, // Prisma 'read' maps to frontend 'isRead'
          sender: n.sender,
          link: n.link,
          // photoUrl: n.photoUrl, // if you use it
        };
      });
    console.log(
      "API_NOTIFICATIONS_GET: Mapped notifications count:",
      mappedNotifications.length
    );

    return NextResponse.json(mappedNotifications);
  } catch (error: any) {
    console.error("API_NOTIFICATIONS_GET_ERROR:", error);
    return NextResponse.json(
      { message: "Error fetching notifications", detail: error.message },
      { status: 500 }
    );
  }
}

// --- Keep your POST handler for "Mark all as read" if you had it ---
export async function POST(request: NextRequest) {
  console.log("API_NOTIFICATIONS_POST: Mark all as read handler started.");
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log("API_NOTIFICATIONS_POST: Token from getToken:", token);

    if (!token || !token.id || token.role !== "CLIENT") {
      console.log("API_NOTIFICATIONS_POST: Unauthorized access.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = token.id as string;
    console.log(
      `API_NOTIFICATIONS_POST: Authorized for user ID: ${userId} to mark all as read.`
    );

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
    console.log(
      "API_NOTIFICATIONS_POST: All unread notifications marked as read for user:",
      userId
    );
    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("API_NOTIFICATIONS_MARK_ALL_READ_ERROR:", error);
    return NextResponse.json(
      {
        message: "Error marking all notifications as read",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
