// src/app/api/admin/alerts/[alertId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

interface RouteContext {
  params: {
    alertId: string;
  };
}

// PUT: Mark a specific alert as read or unread
export async function PUT(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { alertId } = context.params;

  try {
    const { readStatus } = (await request.json()) as { readStatus: boolean };
    if (typeof readStatus !== "boolean") {
      return NextResponse.json(
        { message: "Invalid readStatus provided." },
        { status: 400 }
      );
    }

    const updatedAlert = await prisma.alert.updateMany({
      // updateMany to ensure forAdmin is true
      where: {
        id: alertId,
        forAdmin: true, // Ensure it's an admin alert
      },
      data: {
        read: readStatus,
      },
    });

    if (updatedAlert.count === 0) {
      return NextResponse.json(
        { message: "Alert not found or not an admin alert." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Alert marked as ${readStatus ? "read" : "unread"}.`,
    });
  } catch (error: any) {
    console.error(`API_ADMIN_ALERT_ID_PUT_ERROR (ID: ${alertId}):`, error);
    return NextResponse.json(
      { message: "Error updating alert status", detail: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete/Dismiss an alert (optional)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token || token.role !== Role.ADMIN) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { alertId } = context.params;

  try {
    const result = await prisma.alert.deleteMany({
      where: {
        id: alertId,
        forAdmin: true,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { message: "Alert not found or not an admin alert." },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: "Alert dismissed successfully." });
  } catch (error: any) {
    console.error(`API_ADMIN_ALERT_ID_DELETE_ERROR (ID: ${alertId}):`, error);
    return NextResponse.json(
      { message: "Error dismissing alert", detail: error.message },
      { status: 500 }
    );
  }
}
