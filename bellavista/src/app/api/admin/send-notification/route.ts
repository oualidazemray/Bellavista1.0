// src/app/api/admin/send-notification/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role, NotificationType, User } from "@prisma/client";

interface SendNotificationRequestBody {
  title: string;
  message: string;
  link?: string; // Optional link for the notification
  targetUserEmail?: string; // Email of a specific user to target. If null/empty, sends to all clients.
  targetRole?: Role; // Optionally target all users of a specific role (e.g., all CLIENTS)
  // photoUrl?: string;      // Optional image for the notification
  // type?: NotificationType // Admin can set type, or default to GENERAL/ADMIN_MESSAGE
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json(
      { message: "Unauthorized: Admin role required." },
      { status: 401 }
    );
  }
  const adminSenderName = token.name || "Admin Notification System"; // Use admin's name or a default

  try {
    const body = (await request.json()) as SendNotificationRequestBody;
    const { title, message, link, targetUserEmail, targetRole } = body;

    if (!title || !message) {
      return NextResponse.json(
        { message: "Title and message are required for the notification." },
        { status: 400 }
      );
    }

    const notificationDataBlueprint = {
      type: NotificationType.ADMIN_MESSAGE || NotificationType.GENERAL, // You might want a specific ADMIN_MESSAGE type
      title: title,
      message: message,
      link: link,
      sender: adminSenderName,
      // photoUrl: photoUrl, // If you add this
      read: false, // New notifications are unread
      createdAt: new Date(),
    };

    let usersToNotify: Pick<User, "id">[] = []; // Array of objects like { id: string }

    if (targetUserEmail) {
      // Target a specific user
      const targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail },
        select: { id: true, role: true }, // Select role to ensure they are not an admin if desired
      });
      if (!targetUser) {
        return NextResponse.json(
          { message: `User with email ${targetUserEmail} not found.` },
          { status: 404 }
        );
      }
      // Optional: Prevent admin from sending direct custom message to another admin this way?
      // if (targetUser.role === Role.ADMIN && targetUser.id !== token.id) {
      //   return NextResponse.json({ message: `Cannot send direct notification to another admin via this form.` }, { status: 403 });
      // }
      usersToNotify.push({ id: targetUser.id });
      console.log(
        `API_SEND_NOTIFICATION: Targeting specific user: ${targetUserEmail}`
      );
    } else if (targetRole) {
      // Target all users of a specific role (e.g., all CLIENTS)
      if (!Object.values(Role).includes(targetRole)) {
        return NextResponse.json(
          { message: "Invalid target role specified." },
          { status: 400 }
        );
      }
      usersToNotify = await prisma.user.findMany({
        where: { role: targetRole },
        select: { id: true },
      });
      console.log(
        `API_SEND_NOTIFICATION: Targeting all users with role: ${targetRole}. Found ${usersToNotify.length} users.`
      );
    } else {
      // Default: Target all CLIENT users if no specific user or role is provided
      usersToNotify = await prisma.user.findMany({
        where: { role: Role.CLIENT },
        select: { id: true },
      });
      console.log(
        `API_SEND_NOTIFICATION: Defaulting to target all CLIENT users. Found ${usersToNotify.length} users.`
      );
    }

    if (usersToNotify.length === 0) {
      return NextResponse.json(
        { message: "No target users found for the notification." },
        { status: 404 }
      );
    }

    // Create notifications for all targeted users
    const notificationsToCreate = usersToNotify.map((user) => ({
      ...notificationDataBlueprint,
      userId: user.id,
    }));

    await prisma.notification.createMany({
      data: notificationsToCreate,
    });

    console.log(
      `API_SEND_NOTIFICATION: Successfully created ${notificationsToCreate.length} notifications.`
    );
    return NextResponse.json(
      {
        message: `Notification sent to ${notificationsToCreate.length} user(s).`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API_SEND_NOTIFICATION_ERROR:", error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error sending notification", detail: error.message },
      { status: 500 }
    );
  }
}
